import React from 'react';

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & { raised?: boolean };
export function SynapsePanel({ raised = false, className = '', ...props }: SurfaceProps) {
  return <div className={`${raised ? 'synapse-surface-raised' : 'synapse-surface'} ${className}`.trim()} {...props} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: boolean };
export function SynapseButton({ icon = false, className = '', ...props }: ButtonProps) {
  return <button className={`${icon ? 'synapse-icon-button' : 'onboarding-button onboarding-button-outline'} ${className}`.trim()} {...props} />;
}

export function SynapseIconButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`synapse-icon-button ${className}`.trim()} {...props} />;
}

export function SynapseInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`synapse-address ${className}`.trim()} {...props} />;
}

export function SynapseReveal({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`synapse-workspace ${className}`.trim()} {...props} />;
}
