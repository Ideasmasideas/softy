const Dashboard = require('../models/Dashboard');

exports.getStats = async (req, res) => {
  try {
    const data = await Dashboard.getStats();
    res.json(data);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
  }
};

exports.getGantt = async (req, res) => {
  try {
    const ganttData = await Dashboard.getGantt();
    res.json(ganttData);
  } catch (error) {
    console.error('Error fetching gantt data:', error);
    res.status(500).json({ error: 'Error al obtener datos de Gantt' });
  }
};
