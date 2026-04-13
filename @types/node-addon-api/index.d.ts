declare module 'node-addon-api' {
  export interface NodeAddonAPI {
    include_dir: string;
  }
  
  const nodeAddonAPI: NodeAddonAPI;
  export default nodeAddonAPI;
}
