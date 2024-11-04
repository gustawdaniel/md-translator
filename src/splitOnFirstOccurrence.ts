export function splitOnFirstOccurrence(
    str: string,
    delimiter: string,
): [string] | [string, string] {
    const index = str.indexOf(delimiter);
    if (index === -1) return [str]; // If delimiter is not found, return the whole string
    return [str.substring(0, index), str.substring(index + delimiter.length)];
}