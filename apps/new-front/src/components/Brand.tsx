export function Brand({ size }: { size?: 'sm' | 'xs' }) {
  return (
    <div className={size ? `dn-brand dn-brand--${size}` : 'dn-brand'}>
      <div className="dn-brand__mark" />
      <span className="dn-brand__name">
        dev<span>notes</span>
      </span>
    </div>
  )
}
