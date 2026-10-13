import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAdminCategories, slugify, type CategoryFormData } from '../../hooks/useAdminCategories';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { Category } from '../../types/api';
import styles from './Categories.module.scss';

const emptyForm: CategoryFormData = { name: '', slug: '' };

export const AdminCategoriesPage = () => {
  const { categories, isLoading, isSaving, error, create, update, remove } = useAdminCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setIsModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({ name: category.name, slug: category.slug });
    setSlugTouched(true);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = editing ? await update(editing._id, form) : await create(form);
    if (ok) setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const ok = await remove(confirmDelete._id);
    if (ok) setConfirmDelete(null);
  };

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Categorías</h1>
        <Button onClick={openNew}>
          <Plus aria-hidden="true" /> Nueva categoría
        </Button>
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>No hay categorías registradas todavía.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td><strong>{category.name}</strong></td>
                  <td><code className={styles.slug}>{category.slug}</code></td>
                  <td className={styles.actionsCell}>
                    <button type="button" className={styles.linkBtn} onClick={() => openEdit(category)}>
                      <Pencil aria-hidden="true" /> Editar
                    </button>
                    <button
                      type="button"
                      className={styles.linkBtnDanger}
                      onClick={() => setConfirmDelete(category)}
                    >
                      <Trash2 aria-hidden="true" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Nombre de la categoría"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            hint="Se genera automáticamente a partir del nombre; puede ajustarlo si lo necesita."
            required
          />
          <Button type="submit" isLoading={isSaving}>
            {editing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar categoría">
        <p className={styles.confirmText}>
          ¿Eliminar la categoría "{confirmDelete?.name}"? Esta acción no se puede deshacer.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
};
