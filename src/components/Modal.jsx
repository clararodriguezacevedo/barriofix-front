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

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Cerrar con click en el backdrop: comparar target contra el dialog mismo,
  // porque el click en el backdrop se dispara con el dialog como target.
  function handleClick(e) {
    if (e.target === ref.current) onClose()
  }

  return (
    <dialog ref={ref} onClose={onClose} onClick={handleClick}>
      <div className="dialog-body">
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </dialog>
  )
}
