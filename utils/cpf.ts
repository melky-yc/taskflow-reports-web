export function unmaskCPF(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

export function formatCPF(value: string): string {
  const digits = unmaskCPF(value);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 9);
  const p4 = digits.slice(9, 11);

  if (!digits) return "";
  if (digits.length <= 3) return p1;
  if (digits.length <= 6) return `${p1}.${p2}`;
  if (digits.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

export function maskCPF(value: string): string {
  const digits = unmaskCPF(value);
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}
