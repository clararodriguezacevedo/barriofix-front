import { useEffect, useRef } from 'react'

/**
 * Wrapper del elemento <dialog> nativo. Usar el nativo evita reinventar
 * centrado, focus trap y backdrop en JSX.
 *
 * Uso:
 *   <Modal open={abierto} onClose={cerrar} title="Titulo opcional">
 *     ...contenido...
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children }) {
  const ref = useRef(null)
  // Solo cerramos si el gesto empezó Y terminó sobre el backdrop. Así, arrastrar
  // desde adentro (p. ej. seleccionando texto) y soltar afuera no cierra el modal.
  const apretadoEnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleMouseDown(e) {
    apretadoEnBackdrop.current = e.target === ref.current
  }

  function handleClick(e) {
    if (e.target === ref.current && apretadoEnBackdrop.current) onClose()
    apretadoEnBackdrop.current = false
  }

  return (
    <dialog ref={ref} onClose={onClose} onMouseDown={handleMouseDown} onClick={handleClick}>
      <div className="dialog-body">
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </dialog>
  )
}
