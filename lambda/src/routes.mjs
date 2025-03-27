// src/routes.js
import * as services from './services.js';

export const routes = [
  {
    path: '/daily',
    method: 'GET',
    handler: async () => await services.getAllDaily(),
  },
  {
    path: '/daily',
    method: 'POST',
    handler: async (body) => await services.createDaily(body),
  },
  {
    path: '/daily/:maDaiLy',
    method: 'GET',
    handler: async (params) => await services.getDaily(params.maDaiLy),
  },
  {
    path: '/daily/:maDaiLy',
    method: 'PUT',
    handler: async (params, body) => await services.updateDaily(params.maDaiLy, body),
  },
  {
    path: '/daily/:maDaiLy',
    method: 'DELETE',
    handler: async (params) => await services.deleteDaily(params.maDaiLy),
  },
  {
    path: '/donvitinh',
    method: 'GET',
    handler: async () => await services.getAllDonViTinh(),
  },
  {
    path: '/donvitinh',
    method: 'POST',
    handler: async (body) => await services.createDonViTinh(body),
  },
  {
    path: '/donvitinh/:maDonViTinh',
    method: 'GET',
    handler: async (params) => await services.getDonViTinh(params.maDonViTinh),
  },
  {
    path: '/donvitinh/:maDonViTinh',
    method: 'PUT',
    handler: async (params, body) => await services.updateDonViTinh(params.maDonViTinh, body),
  },
  {
    path: '/donvitinh/:maDonViTinh',
    method: 'DELETE',
    handler: async (params) => await services.deleteDonViTinh(params.maDonViTinh),
  },
];

export function matchRoute(path, method, routes) {
  for (const route of routes) {
    const parts = route.path.split('/');
    const pathParts = path.split('/');
    if (parts.length !== pathParts.length || route.method !== method) continue;

    const params = {};
    let match = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) {
        params[parts[i].slice(1)] = pathParts[i];
      } else if (parts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    if (match) return { handler: route.handler, params };
  }
  return null;
}