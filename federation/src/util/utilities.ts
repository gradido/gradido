export function stringToHex(str: string): string {
  return str
    .split('')
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}
