import client from '../config/database.js';

export async function obtenerMétricasAdmin(req, res) {
  try {
    // Total de ventas
    const ventas = await client.execute(`SELECT SUM(total) AS total_ventas FROM ordenes`);
    const totalVentas = ventas.rows[0]?.total_ventas || 0;

    // Cantidad de órdenes
    const ordenes = await client.execute(`SELECT COUNT(*) AS total_ordenes FROM ordenes`);
    const totalOrdenes = ordenes.rows[0]?.total_ordenes || 0;

    // Órdenes por estado
    const estados = await client.execute(`SELECT estado, COUNT(*) AS cantidad FROM ordenes GROUP BY estado`);
    const ordenesPorEstado = estados.rows;

    // Productos más vendidos (simplificado: basado en ocurrencias en JSON de ordenes.productos)
    const top = await client.execute(`
      SELECT p.nombre, COUNT(*) AS veces_vendido
      FROM ordenes o, json_each(o.productos) j
      JOIN productos p ON p.id = j.value
      GROUP BY p.nombre
      ORDER BY veces_vendido DESC
      LIMIT 5
    `);
    const productosMasVendidos = top.rows;

    // Productos con stock bajo
    const bajoStock = await client.execute(`
      SELECT nombre, stock FROM productos WHERE stock < 5
    `);
    const productosConPocoStock = bajoStock.rows;

    res.json({
      total_ventas: totalVentas,
      total_ordenes: totalOrdenes,
      ordenes_por_estado: ordenesPorEstado,
      productos_mas_vendidos: productosMasVendidos,
      stock_bajo: productosConPocoStock
    });
  } catch (error) {
    console.error('❌ Error obteniendo métricas del dashboard:', error);
    res.status(500).json({ error: 'Error al obtener métricas del dashboard' });
  }
}