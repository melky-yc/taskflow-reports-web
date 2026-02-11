type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassValue =
  | string
  | number
  | bigint
  | null
  | undefined
  | false
  | ClassDictionary
  | ClassValue[];

function appendClass(list: string[], value: ClassValue) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendClass(list, item));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([key, enabled]) => {
      if (enabled) {
        list.push(key);
      }
    });
    return;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    list.push(String(value));
  }
}

export function cn(...classes: ClassValue[]) {
  const list: string[] = [];

  classes.forEach((value) => appendClass(list, value));

  return list.join(" ");
}
