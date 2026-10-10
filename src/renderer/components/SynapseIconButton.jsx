export function SynapseIconButton({ className = "", ...props }) {
  return <button className={`synapse-icon-button ${className}`.trim()} {...props} />;
}
