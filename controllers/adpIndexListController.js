
const adpIndexListService = require('../services/adpIndexListService');

exports.getList = async (req, res) => {
  if (req.query.tab == '1') {
    try {
      const vipGoodsList = await adpIndexListService.getAdpIndexList({ tab: '1', ...req.query });
      res.status(200).json(vipGoodsList);
    } catch (error) {
      console.error('Error fetching VIP goods list:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }else if (req.query.tab == '2') {
    try {
      const meituanGoodsList = await adpIndexListService.getAdpIndexList({ tab: '2', ...req.query });
      res.status(200).json(meituanGoodsList);
    } catch (error) {
      console.error('Error fetching Meituan goods list:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }else if(req.query.tab == '3' ){
        const pddGoodsList = await adpIndexListService.getAdpIndexList({ tab: '3', ...req.query });
    res.status(200).json(pddGoodsList);
  }
  
  else {
    res.status(400).json({ error: 'Invalid tab parameter' });
  }
};