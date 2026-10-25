import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { io as connect, type Socket } from 'socket.io-client';
import { setupSockets } from '../src/sockets';
import { signToken } from '../src/utils/jwt';
import { User } from '../src/models/User';
import { Message } from '../src/models/Message';

let httpServer: HttpServer;
let ioServer: SocketIOServer;
let url: string;
let clients: Socket[] = [];

interface TestUser { id: string; token: string }

const crearUsuario = async (name: string): Promise<TestUser> => {
  const user = await User.create({ email: `${name}@test.com`, name, role: 'student', password: 'secreto123' });
  const id = user._id.toString();
  return { id, token: signToken({ id, email: user.email, role: user.role }) };
};

const conectar = (user: TestUser): Promise<Socket> =>
  new Promise((resolve, reject) => {
    const socket = connect(url, { auth: { token: user.token }, transports: ['websocket'], forceNew: true });
    clients.push(socket);
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });

const esperar = <T = any>(socket: Socket, event: string): Promise<T> =>
  new Promise((resolve) => socket.once(event, resolve));

const emitir = <T = any>(socket: Socket, event: string, payload: unknown): Promise<T> =>
  new Promise((resolve) => socket.emit(event, payload, resolve));

const pausa = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/educaspot-test';
  await mongoose.connect(testUri);
  httpServer = createServer();
  ioServer = new SocketIOServer(httpServer);
  setupSockets(ioServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await ioServer.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterEach(() => {
  clients.forEach((c) => c.disconnect());
  clients = [];
});

describe('Chat en tiempo real', () => {
  it('entrega el mensaje al destinatario aunque no tenga la conversación abierta, y lo marca como entregado', async () => {
    const ana = await crearUsuario('ana');
    const beto = await crearUsuario('beto');
    const sockAna = await conectar(ana);
    const sockBeto = await conectar(beto);

    const recibido = esperar(sockBeto, 'chat:message');
    const eco = esperar(sockAna, 'chat:message');
    const ack = await emitir(sockAna, 'chat:message', { otherUserId: beto.id, content: ' hola ', clientId: 'c1' });

    expect(ack.ok).toBe(true);
    const mensaje = await recibido;
    expect(mensaje.content).toBe('hola');
    expect(mensaje.senderId).toBe(ana.id);
    expect(mensaje.deliveredTo).toContain(beto.id);
    expect((await eco).clientId).toBe('c1');
  });

  it('no duplica el mensaje si se reenvía con el mismo clientId', async () => {
    const ana = await crearUsuario('ana');
    const beto = await crearUsuario('beto');
    const sockAna = await conectar(ana);

    const a = await emitir(sockAna, 'chat:message', { otherUserId: beto.id, content: 'hola', clientId: 'dup' });
    const b = await emitir(sockAna, 'chat:message', { otherUserId: beto.id, content: 'hola', clientId: 'dup' });

    expect(a.messageId).toBe(b.messageId);
    expect(await Message.countDocuments()).toBe(1);
  });

  it('rechaza ids inválidos, mensajes vacíos y escribirse a sí mismo', async () => {
    const ana = await crearUsuario('ana');
    const sockAna = await conectar(ana);

    expect((await emitir(sockAna, 'chat:message', { otherUserId: 'xyz', content: 'hola' })).ok).toBe(false);
    expect((await emitir(sockAna, 'chat:message', { otherUserId: ana.id, content: 'hola' })).ok).toBe(false);
    const beto = await crearUsuario('beto');
    expect((await emitir(sockAna, 'chat:message', { otherUserId: beto.id, content: '   ' })).ok).toBe(false);
    expect(await Message.countDocuments()).toBe(0);
  });

  it('si el destinatario está desconectado queda sin entregar y se avisa al remitente cuando se conecta', async () => {
    const ana = await crearUsuario('ana');
    const beto = await crearUsuario('beto');
    const sockAna = await conectar(ana);

    const ack = await emitir(sockAna, 'chat:message', { otherUserId: beto.id, content: 'hola', clientId: 'off' });
    expect((await Message.findById(ack.messageId))!.deliveredTo).toHaveLength(0);

    const entregado = esperar(sockAna, 'chat:delivered');
    await conectar(beto);
    const evento = await entregado;
    expect(evento.messageIds).toEqual([ack.messageId]);
    expect(evento.userId).toBe(beto.id);
    expect((await Message.findById(ack.messageId))!.deliveredTo.map(String)).toContain(beto.id);
  });

  it('chat:read notifica al remitente y solo aplica a mensajes de los threads del usuario', async () => {
    const ana = await crearUsuario('ana');
    const beto = await crearUsuario('beto');
    const carla = await crearUsuario('carla');
    const sockAna = await conectar(ana);
    const sockBeto = await conectar(beto);
    const sockCarla = await conectar(carla);

    const { messageId } = await emitir(sockAna, 'chat:message', { otherUserId: beto.id, content: 'hola' });

    // Carla no pertenece al thread: su lectura no debe tener efecto.
    await emitir(sockCarla, 'chat:read', { messageIds: [messageId] });
    expect((await Message.findById(messageId))!.readBy.map(String)).not.toContain(carla.id);

    const leido = esperar(sockAna, 'chat:read');
    await emitir(sockBeto, 'chat:read', { messageIds: [messageId] });
    const evento = await leido;
    expect(evento.readerId).toBe(beto.id);
    expect(evento.messageIds).toEqual([messageId]);
    expect((await Message.findById(messageId))!.readBy.map(String)).toContain(beto.id);
  });

  it('retransmite "escribiendo" solo al destinatario', async () => {
    const ana = await crearUsuario('ana');
    const beto = await crearUsuario('beto');
    const carla = await crearUsuario('carla');
    const sockAna = await conectar(ana);
    const sockBeto = await conectar(beto);
    const sockCarla = await conectar(carla);

    let carlaRecibio = false;
    sockCarla.on('chat:typing', () => { carlaRecibio = true; });

    const typing = esperar(sockBeto, 'chat:typing');
    sockAna.emit('chat:typing', { otherUserId: beto.id, isTyping: true });
    const evento = await typing;

    expect(evento).toMatchObject({ userId: ana.id, isTyping: true });
    await pausa(100);
    expect(carlaRecibio).toBe(false);
  });

  it('informa presencia al abrir la conversación y avisa cuando el contacto se desconecta', async () => {
    const ana = await crearUsuario('ana');
    const beto = await crearUsuario('beto');
    const sockAna = await conectar(ana);
    const sockBeto = await conectar(beto);

    const join = await emitir(sockAna, 'chat:join', { otherUserId: beto.id });
    expect(join).toMatchObject({ ok: true, contact: { _id: beto.id, name: 'beto' }, presence: { online: true } });

    const update = esperar(sockAna, 'presence:update');
    sockBeto.disconnect();
    const evento = await update;
    expect(evento).toMatchObject({ userId: beto.id, online: false });
    expect(evento.lastSeenAt).toBeTruthy();

    const joinOffline = await emitir(sockAna, 'chat:join', { otherUserId: beto.id });
    expect(joinOffline.presence.online).toBe(false);
    expect(joinOffline.presence.lastSeenAt).toBeTruthy();
  });
});
