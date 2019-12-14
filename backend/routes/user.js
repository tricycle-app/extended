const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

/** Get stats & last product scanned */
router.get('/stat-history/:id', userController.getStatsAndLastProduct);

/** Get history of scan products */
router.get('/history/:id', userController.getHistoryOfUser);

/** Get all users */
router.get('/all', userController.getAllUsers);

/** Get information profile */
router.get('/:id', userController.getInformationOfUser);

/** Edit information profile */
router.put('/:id', userController.editInformationOfUser);

/** Delete a user */
router.delete('/delete/:id', userController.deleteUser);


module.exports = router;