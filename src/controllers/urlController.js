const urlService = require('../services/urlService');

const shorten = async (req, res, next) => {
  try {
    const { url } = req.body;
    const result = await urlService.shortenUrl(url);
    const shortUrl = `${process.env.BASE_URL}/${result.code}`;
    res.status(201).json({ success: true, short_url: shortUrl, code: result.code });
  } catch (err) {
    next(err);
  }
};

const redirect = async (req, res, next) => {
  try {
    const { code } = req.params;
    const longUrl = await urlService.getLongUrl(code);
    res.redirect(301, longUrl);
  } catch (err) {
    next(err);
  }
};

const stats = async (req, res, next) => {
  try {
    const { code } = req.params;
    const data = await urlService.getStats(code);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteUrl = async (req, res, next) => {
  try {
    const { code } = req.params;
    await urlService.deleteUrl(code);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { shorten, redirect, stats, deleteUrl };
