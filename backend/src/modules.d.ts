declare module 'sbffi' {
  export function getNativeFunction(
    pathToSharedLibrary: string,
    functionName: string,
    returnType: string,
    parameterTypes: string[],
  ): string

  export function getBufferPointer(buffer: any): any
}
