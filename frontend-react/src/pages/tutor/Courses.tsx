import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Ban } from 'lucide-react';
import { useMyCourses, useCategories, type CourseFormData } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { formatQ } from '../../services/formatters';
import type { Course, Modality } from '../../types/api';
import inputStyles from '../../components/ui/Input.module.scss';
import styles from './Courses.module.scss';

const MODALITY_LABELS: Record<Modality, string> = {
  virtual: 'Virtual',
  'presencial-tutor': 'En mi casa',
  'presencial-estudiante': 'A domicilio del estudiante',
};

const MODALITIES: Modality[] = ['virtual', 'presencial-tutor', 'presencial-estudiante'];

const emptyForm = (defaultCategoryId: string): CourseFormData => ({
  title: '',
  description: '',
  categoryId: defaultCategoryId,
  modalities: ['virtual'],
  baseRate: 100,
  ratePerKm: 0,
});

export const TutorCoursesPage = () => {
  const { courses, isLoading, isSaving, error, create, update, deactivate } = useMyCourses();
  const { categories } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseFormData>(emptyForm(''));

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm(categories[0]?._id ?? ''));
    setIsModalOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description,
      categoryId: c.categoryId._id,
      modalities: c.modalities,
      baseRate: c.baseRate,
      ratePerKm: c.ratePerKm,
    });
    setIsModalOpen(true);
  };

  const toggleModality = (m: Modality) => {
    setForm((f) => ({
      ...f,
      modalities: f.modalities.includes(m)
        ? f.modalities.filter((x) => x !== m)
        : [...f.modalities, m],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.modalities.length === 0) return;
    const ok = editing ? await update(editing._id, form) : await create(form);
    if (ok) setIsModalOpen(false);
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    await deactivate(confirmDeactivate._id);
    setConfirmDeactivate(null);
  };

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Mis cursos</h1>
        <Button onClick={openNew} disabled={categories.length === 0}>
          <Plus aria-hidden="true" /> Nuevo curso
        </Button>
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : courses.length === 0 ? (
        <div className={styles.empty}>No tiene cursos aún. Cree el primero para aparecer en el buscador de tutores.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Modalidades</th>
                <th>Tarifa/h</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.title}</strong></td>
                  <td>{c.categoryId.name}</td>
                  <td>
                    <div className={styles.badgeGroup}>
                      {c.modalities.map((m) => <span key={m} className={styles.modalityBadge}>{MODALITY_LABELS[m]}</span>)}
                    </div>
                  </td>
                  <td>{formatQ(c.baseRate)}</td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.linkBtn} onClick={() => openEdit(c)}>
                      <Pencil aria-hidden="true" /> Editar
                    </button>
                    <button type="button" className={styles.linkBtnDanger} onClick={() => setConfirmDeactivate(c)}>
                      <Ban aria-hidden="true" /> Desactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar curso' : 'Nuevo curso'}>
        <form onSubmit={handleSubmit}>
          <Input
            label="Título del curso"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            required
          />
          <div className={inputStyles.field}>
            <label className={inputStyles.label} htmlFor="course-category">Categoría</label>
            <select
              id="course-category"
              className={inputStyles.input}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className={inputStyles.field}>
            <label className={inputStyles.label}>Modalidades</label>
            <div className={styles.chipGroup}>
              {MODALITIES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={form.modalities.includes(m)}
                  className={`${styles.chip} ${form.modalities.includes(m) ? styles.chipSelected : ''}`}
                  onClick={() => toggleModality(m)}
                >
                  {MODALITY_LABELS[m]}
                </button>
              ))}
            </div>
            {form.modalities.length === 0 && <span className={inputStyles.errorMsg}>Elija al menos una modalidad.</span>}
          </div>
          <Input
            label="Tarifa base por hora (Q)"
            type="number"
            value={form.baseRate}
            onChange={(e) => setForm({ ...form, baseRate: Number(e.target.value) })}
            min={1}
            required
          />
          <Input
            label="Tarifa adicional por kilómetro (Q/km)"
            type="number"
            value={form.ratePerKm}
            onChange={(e) => setForm({ ...form, ratePerKm: Number(e.target.value) })}
            min={0}
            step={0.5}
            hint="Solo aplica a la modalidad 'a domicilio del estudiante'. Deje 0 si no aplica."
          />
          <Button type="submit" isLoading={isSaving} disabled={form.modalities.length === 0}>
            {editing ? 'Guardar cambios' : 'Crear curso'}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={!!confirmDeactivate} onClose={() => setConfirmDeactivate(null)} title="Desactivar curso">
        <p className={styles.confirmText}>
          ¿Desactivar "{confirmDeactivate?.title}"? Dejará de aparecer en el buscador y los estudiantes
          no podrán reservarlo. Esta acción no se puede revertir desde la interfaz.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={() => setConfirmDeactivate(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeactivate}>Desactivar</Button>
        </div>
      </Modal>
    </div>
  );
};
