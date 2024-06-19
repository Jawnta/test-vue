export const apiUrl = (path: any) => {
    const mode = import.meta.env.MODE;
    const { location } = window;
    let baseUrl;
  
    if (mode === 'production') {
      const pattern = /^\/dynapp-server\/public\/([^/]+)\/([^/]+)\/?.*$/;
      const matches = location.pathname.match(pattern);
  
      baseUrl = matches
        ? `${location.origin}/dynapp-server/public/${matches[1]}/${matches[2]}/`
        : `../`;
    } else {
      baseUrl = `${location.origin}/dynapp-server/`;
    }
  
    return `${baseUrl}${path}`;
  };
  