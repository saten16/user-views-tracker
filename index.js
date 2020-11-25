const express = require("express");
const app = express();
const moment = require('moment');

app.set("view engine", "ejs");
app.set("views", "pages");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());


const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";


app.get("/", (req, res) => {
    return res.redirect("/products");
});

app.get("/products", (req, res)=>{
    MongoClient.connect(url, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true
    }, (err, db) => {
        if (err) throw err;
        const dbo = db.db("test_db");
        dbo.collection("products").find({}).toArray((err, result) => {
            if (err) throw err;

            db.close();

            res.render('products', { result });
        });
    });
});

app.get("/products/:id/views", (req, res) => {  
    let id = req.params.id;

    MongoClient.connect(url, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true
    }, (err, db) => {
        if (err) throw err;

        const dbo = db.db("test_db");

        let query = { productId: id };

        dbo.collection("userView").find(query).toArray((err, result) => {
            if (err) throw err;

            let uniqueViews = [];

            result.filter(item => {
                let i = uniqueViews.findIndex(x => (x.userId == item.userId));
                return i <= -1 ? uniqueViews.push(item) : null;
            });

            if (req.query.filter) {
                if (req.query.filter === 'daily') {
                    let todayDate =  new Date().toJSON();
                    todayDate = todayDate.slice(0, todayDate.indexOf('T'));
                    
                    uniqueViews = uniqueViews.filter(view => view.viewDate === todayDate);
                } else if (req.query.filter === 'weekly') {                    
                    let startOfWeek = moment().startOf("isoWeek").toDate().toJSON();
                    startOfWeek = startOfWeek.slice(0, startOfWeek.indexOf('T'));

                    let endOfWeek = moment().endOf("isoWeek").toDate().toJSON();
                    endOfWeek = endOfWeek.slice(0, endOfWeek.indexOf('T'));

                    uniqueViews = uniqueViews.filter(view => new Date(view.viewDate) > new Date(startOfWeek) && new Date(view.viewDate) <= new Date(endOfWeek));
                } else if (req.query.filter === 'monthly') {
                    let startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
                    let endOfMonth   = moment().endOf('month').format('YYYY-MM-DD');

                    console.log(typeof startOfMonth)

                    uniqueViews = uniqueViews.filter(view => new Date(view.viewDate) > new Date(startOfMonth) && new Date(view.viewDate) <= new Date(endOfMonth));
                } else if (!isNaN(parseInt(req.query.filter))) {
                    let fromDate = req.url.split('=')[1].split('/')[0];
                    let toDate = req.url.split('=')[1].split('/')[1];
                    if (fromDate <= toDate) {
                        uniqueViews = uniqueViews.filter(view => new Date(view.viewDate) >= new Date(fromDate) && new Date(view.viewDate) <= new Date(toDate));
                    }
                }
            }

            db.close();

            res.render('users', { result: uniqueViews });
        });
    });
});

app.listen(3200, () => {
    console.log('server started at port 3200');
});
