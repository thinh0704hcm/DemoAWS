// handler.mjs
import { routes, matchRoute } from './routes.mjs';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const { httpMethod, path, body } = event;
    const parsedBody = body ? JSON.parse(body) : {};

    const route = matchRoute(path, httpMethod, routes);
    if (!route) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Route not found' }),
      };
    }

    const result = await route.handler(route.params, parsedBody);
    const isCreate = httpMethod === 'POST';
    const isDelete = httpMethod === 'DELETE';
    return {
      statusCode: isCreate ? 201 : 200,
      headers,
      body: JSON.stringify({
        ...(isCreate ? { message: `${path.slice(1)} created successfully` } : {}),
        ...(isDelete ? { message: `${path.slice(1)} soft-deleted successfully` } : {}),
        ...result,
      }),
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: err.message.includes('not found') ? 404 : 400,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}