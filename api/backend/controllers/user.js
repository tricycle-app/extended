const User = require('../models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

/**
 * @api {get} /add-product/history/:id Add a product scanned in history of user
 * @apiGroup User
 * @apiParam {Number} id User id
 * @apiSuccess {String} message Success message
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "message": "Produit scanné ajouté à l'historique",
 *    }
 */
/** Add a product scanned in history of user */
exports.addProductInHistory = (req, res) => {
    const idProduct = mongoose.Types.ObjectId(req.body._id);
    
    User.updateOne({ _id: req.params.id }, { 
        $push: {
            history: { product: idProduct, date_scan: new Date(), owner: false }
        },
        $inc: { number_scan: 1 }
    })
    .then(() => res.status(201).json({ message: 'Produit scannés ajouté à l\'historique'}))
    .catch(error => res.status(400).json({ error }));
}

/**
 * @api {get} /stat-history/:id Return stats and last product scanned for user
 * @apiGroup User
 * @apiParam {Number} id User id
 * @apiSuccess {Object} data Stats and history of user
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [{
 *      "_id": "64e464ee646e4",
 *      "number_scan": 1,
 *      "history": [{
 *          "product": "efojef54fe55f45ef",
 *          "date_scan": "2020-02-06",
 *          "owner": true
 *      }],
 *      "productInfo": [{
 *          "_id": "jejfljef464fe464effe",
 *          "brand": ["Super U"],
 *          "categories": ["Epicerie"],
 *          "packaging": ["Boîte en verre"],
 *          "bin": ["verre"],
 *          "name": "Echalotte",
 *          "description": "Echalotte en poudre",
 *          "img": "http://google.com",
 *          "barcode": "54346434664223",
 *          "creation_date": "2020-02-06"
 *      }]
 *    },
 *    {
 *      "total_today": 1
 *    }]
 */
/** Return stats and last product scanned for user */
exports.getStatsAndLastProduct = (req, res) => {
    const userId = mongoose.Types.ObjectId(req.params.id);
    let userHistory = null;
    
    // Get last scan and total of scan 
    User.aggregate([
        { $match: { _id: userId }},
        { $unwind: '$history' },
        { $sort: { 'history.date_scan': 1 }},
        { $group: { _id: '$_id', 'number_scan': { $first: '$number_scan'}, 'list-history': { $push: '$history' } } },
        { $project: { 'history': { $slice: ['$list-history', -1]}, number_scan: 1 } },
        { $lookup: { from: 'product', localField: 'history.product', foreignField: '_id', as: 'productInfo'} }
    ])
        .then(dataHistory => {
            userHistory = dataHistory;
            // Get total scan for today
            User.aggregate([ 
                { $unwind: '$history' },
                { $match: { _id: userId, 'history.date_scan': { $gte: new Date(new Date().setHours(00, 00, 00)), $lt: new Date(new Date().setHours(23, 59, 59)) }  }},
                { $count: 'total_today'}
            ])
            .then((userStatsNow) => {
                const data = userHistory.concat(userStatsNow);
                res.status(200).json(data);
            })
            .catch(error => res.status(404).json({ error }));
        })
        .catch(error => res.status(404).json({error}));
};



/**
 * @api {get} /history/:id Return history of user 
 * @apiGroup User
 * @apiParam {Number} id User id
 * @apiSuccess {Object} data History of user
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [{
 *      "_id": "64e464ee646e4",
 *      "history": [{
 *          "product": "efojef54fe55f45ef",
 *          "date_scan": "2020-02-06",
 *          "owner": true
 *      }],
 *      "productInfo": [{
 *          "_id": "jejfljef464fe464effe",
 *          "brand": ["Super U"],
 *          "categories": ["Epicerie"],
 *          "packaging": ["Boîte en verre"],
 *          "bin": ["verre"],
 *          "name": "Echalotte",
 *          "description": "Echalotte en poudre",
 *          "img": "http://google.com",
 *          "barcode": "54346434664223",
 *          "creation_date": "2020-02-06"
 *      }]
 *    }]
 */
/** Return history of user */
exports.getHistoryOfUser = (req, res) => {
    const userId = mongoose.Types.ObjectId(req.params.id);

    User.aggregate([
        { $match: {_id: userId }},
        { $lookup: { from: 'product', localField: 'history.product', foreignField: '_id', as: 'productInfo'} }, 
        { $project: { history: 1, productInfo: 1 } }
    ])
        .then(user => res.status(200).json(user))
        .catch(error => res.status(404).json({error}));
};

/**
 * @api {get} /all Return all users
 * @apiGroup User
 * @apiSuccess {Object} data All users
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    [{
 *      "roles": ["admin"],
 *      "history": [],
 *      "fullname": "Arthur Geay",
 *      "mail": "arthur.geay@ynov.com",
 *      "password": "jlejlfjeljefealjal",
 *      "timezone": "UTC +1",
 *      "registration_date": "2019-01-01",
 *      "number_scan": 0
 *    },
 *    {
 *      "roles": ["admin"],
 *      "history": [],
 *      "fullname": "Arthur Geay",
 *      "mail": "arthur.geay@ynov.com",
 *      "password": "jlejlfjeljefealjal",
 *      "timezone": "UTC +1",
 *      "registration_date": "2019-01-01",
 *      "number_scan": 0
 *    }]
 */
/** Return all users */
exports.getAllUsers = (req, res) => {
    User.find()
        .then((users) => res.status(200).json(users))
        .catch(error => res.status(400).json({ error }));
};

/**
 * @api {get} /:id Return information of user
 * @apiGroup User
 * @apiParam {Number} id User id
 * @apiSuccess {Object} data User information
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "roles": ["admin"],
 *      "history": [],
 *      "fullname": "Arthur Geay",
 *      "mail": "arthur.geay@ynov.com",
 *      "password": "jlejlfjeljefealjal",
 *      "timezone": "UTC +1",
 *      "registration_date": "2019-01-01",
 *      "number_scan": 0
 *    }
 */
/** Return information of user */
exports.getInformationOfUser = (req, res) => {
    User.findOne({_id: req.params.id}, {fullname: 1, mail: 1, timezone: 1, number_scan: 1, registration_date: 1})
        .then(user => res.status(200).json(user))
        .catch(error => res.status(404).json({error}));
};

/**
 * @api {put} /:id Edit information of user
 * @apiGroup User
 * @apiParam {Number} id User id
 * @apiSuccess {String} message Success message
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "message": "Informations du profil mis à jour"
 *    }
 */
/** Edit informations of user */
exports.editInformationOfUser = (req, res) => {
    User.updateOne({ _id: req.params.id}, {...req.body, _id: req.params.id })
        .then(() => res.status(200).json({message: 'Informations du profil mis à jour'}))
        .catch(error => res.status(400).json({error}));
};

/**
 * @api {delete} /:id Delete information of user
 * @apiGroup User
 * @apiParam {Number} id User id
 * @apiSuccess {String} message Success message
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "message": "Utilisateur supprimé"
 *    }
 */
/** Delete user  */
exports.deleteUser = (req, res) => {
    User.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Utilisateur supprimé'}))
        .catch((error) => res.status(400).json({error}));
};

/**
 * @api {post} /login User login
 * @apiGroup User
 * @apiSuccess {Object} data User logged information
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "message": "Utilisateur authentifié",
 *      "user": {
 *          "userId": "2e43fef4e34e34e",
 *          "role": ["admin"]
 *      }
 *    }
 */
exports.login = (req, res) => {
    User.findOne({ mail: req.body.mail })
        .then(user => {
            if(!user) {
                return res.status(401).json({ error: "L'utilisateur n'existe pas"});
            }

            bcrypt.compare(req.body.password, user.password) 
                .then(valid => {
                    if(!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect'});
                    }
                    req.session.user = { userId: user._id, mail: user.mail, roles: user.roles };
                    return res.status(200).json({message: 'Utilisateur authentifié', user: { userId: user._id, role: user.roles } });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({error}));
};

/**
 * @api {get} /logout User logout
 * @apiGroup User
 * @apiSuccess {Object} message User is logged out
 * @apiSuccessExample {json} Success
 *    HTTP/1.1 200 OK
 *    {
 *      "message": "Utilisateur déconnecté",
 *    }
 */
exports.logout = (req, res) => {
    if(!req.session.user) {
        return res.status(400).json({ error: 'Déconnexion impossible'});
    }   

    try {
        req.session.destroy(err => {
            if(err) throw (err);
            res.clearCookie('user_sid');
            res.status(200).json({ message: 'Utilisateur déconnecté'});
        });
    } catch (err) {
        res.status(422).json({ err });
    }
    
};

    