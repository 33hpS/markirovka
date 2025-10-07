type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassDictionary
  | ClassArray;

type ClassDictionary = Record<string, unknown>;
type ClassArray = ClassValue[];

function toVal(mix: ClassValue): string {
  let k: string;
  const str: string[] = [];

  if (typeof mix === 'string' || typeof mix === 'number') {
    return String(mix);
  }

  if (typeof mix === 'object') {
    if (Array.isArray(mix)) {
      for (let i = 0; i < mix.length; i++) {
        const x = toVal(mix[i]);
        if (x) str.push(x);
      }
    } else if (mix !== null) {
      const dict = mix as ClassDictionary;
      for (k in dict) {
        if (Object.prototype.hasOwnProperty.call(dict, k) && dict[k]) {
          str.push(k);
        }
      }
    }
  }

  return str.join(' ');
}

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const value = toVal(inputs[i]);
    if (value) {
      classes.push(value);
    }
  }
  return classes.join(' ');
}
