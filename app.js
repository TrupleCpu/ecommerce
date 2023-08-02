const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const multer = require('multer');
const { Server, Socket } = require('socket.io');
const http = require('http');

admin.initializeApp({
  credential: admin.credential.cert('./ServiceAccountKey.json'),
  storageBucket: 'ecommerce-4f9b2.appspot.com'
});

const bucket = admin.storage().bucket();
const { createToken, validateToken } = require('./Jwebtoken');
const { error } = require('console');
const { rejects } = require('assert');
const { resolve } = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
////Kuhaa ang price, productname

const app = express();
app.use(
  cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
      name: 'connection-sid',
      maxAge: 86400000,
    },
  })
);

const db = mysql.createConnection({
  user: 'root',
  host: 'localhost',
  password: 'password',
  database: 'test',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

const server =  app.listen(3002, () => {
  console.log("Listening")
})

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

app.post('/upload', upload.single('image'), (req, res, next) => {
  const file = req.file;
  const sellerName = req.body.sellerName;
  const productName = req.body.productName;
  const productPrice = req.body.productPrice;
  const productQuantity = req.body.productQuantity;

  const timeStamp = new Date().getTime();
  const fileUpload = bucket.file(`${sellerName}_${timeStamp}`);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });
////Kuhaa ang price, productname


  blobStream.on('finish', () => {
    const productURL = `https://storage.googleapis.com/ecommerce-4f9b2.appspot.com/${fileUpload.name}`;

    db.query(
      'INSERT INTO items (sellerName, productURL,  productName, productPrice, productQuantity) VALUES (?,?,?,?,?)',
      [sellerName, productURL, productName, productPrice, productQuantity],
      (error, result) => {
        if (error) {
          return res.status(500).json({ message: error });
        }

        io.emit('newProduct', { sellerName, productURL, productName, productPrice, productQuantity });
        console.log('file uploaded successfully');
        res.status(200).json({ message: 'Image uploaded Successfully' });
      }
    );
  });

  blobStream.end(file.buffer);
});

const getDate = () => {
  const currentDate = new Date();

  const Month = currentDate.getMonth();
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
   
  
  const date = `${Month}/${day}/${year}`

  return date;
}
const getTime = () => {
  const currentDate = new Date();

  const Hour =  currentDate.getHours();
  const Minutes = currentDate.getMinutes();
   const convertTime = Hour % 12 || 12;
   const amOrPm = Hour >= 12 ? 'PM' : 'AM';

   const converMinute = Minutes < 10 ? '0' + Minutes : Minutes; 
  const time = `${convertTime}:${converMinute} ${amOrPm}`
  return time;
}
app.post('/checkout', async (req, res) => {
  const {address,postalCode,phoneNUmber,paymentMethod, addtoCart} = req.body;
  const date = getDate();
  const time = getTime();



  try {
    for(const item of addtoCart){
      const {idproduct, buyername, sellername, itemname, itemprice, itemquantity, itemtotalquantity, imageurl, total} = item;
  /* 
--  subtrack the item quantity to the product quantity then if the product quantity reaches to 0 marked the status of the item to sold
*/

      await new Promise((resolve, reject) => {
         db.query('INSERT INTO checkout (idproduct, buyername, sellername, itemname,  itemprice, itemquantity, itemtotalquantity ,imageurl, total) VALUES (?,?,?,?,?,?,?,?,?)', 
    [idproduct, buyername, sellername, itemname, itemprice, itemquantity, itemtotalquantity ,imageurl, total], (error, result) => {
      if(error) {
        reject(error)

      } else {
         resolve(result)
      }

    })
    })
  }

  for (const item of addtoCart) {
    const {itemname, sellername ,buyername, productName,itemquantity, itemtotalquantity,itemprice, idproduct,total } = item;
    const UpdatedQuantity = itemtotalquantity - itemquantity;


    await new Promise((resolve, reject) => {
      db.query(
      'UPDATE cart SET status = "sold" WHERE itemname = ?', [itemname] , (error, result)=>{
          if(error){
            console.error('ERROR IN UPDATING STATUS')
          } else {
           db.query('UPDATE users SET cartCounter = 0 WHERE username = ?', [buyername], (error, result) => {
                 db.query('SELECT cartCounter FROM users WHERE username = ?', [buyername], (error, result) => {
                   if(error){
                    console.error({message: error})
                   } else {
                    io.emit('cartCounter', result[0].cartCounter)
                    db.query('SELECT * FROM cart WHERE buyername = ? AND status != "sold"', [buyername], (error, result) => {
                        if(error) {
                          console.error({message: error})
                          reject(error)
                        } else {
                          resolve(result)
                         io.emit("checkedOut", ({buyername}))
                        }
                    })
                   }
                 })
           })
          }
      })
    })
       
        

       await new Promise((resolve, reject) => {
        db.query('UPDATE items SET productQuantity = ? WHERE id = ?', [UpdatedQuantity, idproduct], (error,result) => {
          if(error){
            console.error({message: error})
          } else {
                 console.log('SUCCESS!!') 
                 db.query('SELECT * FROM items', (error, result) => {
                  if(error){
                    console.error({message: error})
                  } else {
                     if(result.length > 0) {
                      resolve(result)
                      io.emit('productQuantity', result)
                     } else {
                      io.emit('productQuantity', 0)
                     }
                  }
                })
          }
      })
       })
       
      await new Promise((resolve, reject) => {
        db.query('INSERT INTO transactions  (buyername, sellername, phoneNumber,productname, quantity, price, total, date, time, paymentMethod, address,postalcode) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [buyername, sellername, phoneNUmber,itemname, itemquantity, itemprice, total,date,time ,paymentMethod,address,postalCode ], (error, result) => {
          if(error){
            reject(error)
            console.error(error)
            
          } else {
            resolve(result)
          }
        })
      }) 
    }

  res.status(200).json({message: 'Wait for the seller to respond! THANK YOU'})
  } catch (error) {
    res.status(500).json({message: error})
  }
  
})
app.get('/transactions', (req, res) => {
   
  const buyername = req.session.user;

  db.query("SELECT * FROM transactions WHERE buyername = ? ", [buyername], (error,result) => {
    if(error) {
      console.error(error)
      res.status(500).json({message: error});
    } else {
      res.status(200).json(result)
    }
  })

})
app.post('/cart', (req, res) => {
  const buyername = req.body.buyername;
  const idproduct = req.body.idproduct;
  const sellername = req.body.sellername;
  const itemname = req.body.itemname;
  const itemprice = req.body.itemprice;
  const itemquantity = req.body.itemquantity;
  const itemtotalquantity = req.body.itemtotalquantity;
  const imageurl = req.body.imageurl;
  const total = req.body.total;
 db.query('UPDATE users SET cartCounter = cartCounter + 1 WHERE username = ?', [buyername], (error, resultCount) => {
    if(error) {
      res.status(500).json({message: error})
    } else {
      db.query('SELECT cartCounter FROM users WHERE username = ?', [buyername], (error, result) => {
        if(error){
          res.status(500).json({message: error})
        } else {
            if(result.length > 0){
              const updatedCounter = result[0].cartCounter;
              db.query(
                'INSERT INTO cart (idproduct, buyername, sellername, itemname,  itemprice, itemquantity, itemtotalquantity ,imageurl, total) VALUES (?,?,?,?,?,?,?,?,?)',
                [idproduct, buyername, sellername, itemname, itemprice, itemquantity, itemtotalquantity ,imageurl, total],
                (error, result) => {
                   if(!error) {
                    res.status(200).json(result)
                    const idcart = result.insertId
                    io.emit('newCart', {idproduct, buyername, sellername, itemname, itemprice, itemquantity, itemtotalquantity ,imageurl, total, idcart})
                    io.emit('cartCounter', updatedCounter)
                   } else {
                    res.status(500).json({message: error})
                   }
               })
            }
        }
      })
    }
 })
})
app.get('/cartCounter', (req, res) => {
     
  const username = req.session.user;

  db.query('SELECT cartCounter FROM users WHERE username = ?', [username], (error, result) => {
    if(error) {
      res.status(500).json({message: error})
    } else {
      res.status(200).json(result)
    }
  })
})
app.get('/cart', (req, res) => {

   const buyername = req.session.user;

  db.query('SELECT * FROM cart WHERE buyername = ? AND status != "sold"', [buyername] ,(error, result) => {
    if(error){
      res.status(500).json({message: error.message})
    } else {
      res.status(200).json(result);
    }
  })
})

app.post('/delete',  async (req,res) => {
  const idToDelete = req.body.id;
  const buyername = req.body.user;
  console.log(idToDelete)
   try { 
       await new Promise((resolve, reject) => {
        db.query('DELETE FROM cart WHERE idcart = ?', [idToDelete], (error, result) => {
            if(error){
              reject(error)
            } else {
              resolve(result)
            }
        })
       })

       const updateCart = await new Promise((resolve, reject) => {
        db.query('SELECT * FROM cart', (error, result) => {
           if(error){
             reject(error)
           } else {
              resolve(result)
           }
        })
    })
    const deductCart = await new Promise((resolve, reject) => {
      db.query('UPDATE users SET cartCounter = cartCounter - 1 WHERE username = ?', [buyername], (error, result )=> {
        if(error){
          reject(error)
        } else {
           resolve(result)
        }
      })
    })
     res.status(200).json(updateCart)
    } catch (error) {
    res.status(500).json({message: error})
   }
})


app.get('/buy', (req, res) => {
   db.query('SELECT * FROM buyer', (error, result) => {
       if(error){
           res.status(500).json({message: error.message})
       } else {
        res.status(200).json(result)
       }
   })
})


app.post('/update', (req, res) => {
  const newQuantity = req.body.newQuantity;
  const id = req.body.id;
  

  db.query('UPDATE items SET productQuantity = ? WHERE id = ?', [newQuantity, id], (error, result) => {
    if (error) {
      console.log(error)
      res.status(500).json({ message: error.message });
    } else {
      console.log(newQuantity)
      console.log(id)
      res.status(200).json({ message: 'Update Successfully', result });
    }
  });
});

app.get('/products', async (req, res) => {
  try {
    db.query('SELECT * FROM items', (error, result) => {
      if (error) {
        console.log({ error: error });
        res.status(500).json({ error: 'UNABLE TO RETRIEVE IMAGES' });
      } else {
        res.status(200).json({ result });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});



app.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;


bcrypt.hash(password,saltRounds, (err, hash) => {
  const checkquery = "SELECT * FROM users WHERE username = ?";
  db.query(checkquery, [username], (checkErr, checkResult) => {
    if(checkErr)
    {
      return res.status(500).json({message: 'Error occured during registration'})
    }
     
    
    if(checkResult.length > 0)
    {
      return res.status(200).json({message: 'Account already exist'})
    }   
  
  
  //if not insert to database
  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.query(query, [username, hash], (err, result) => {
    if (err) {
      console.error('Error registering user:', err);
      return res.status(500).json({ message: 'Error occurred during registration' });
    }
    return res.status(200).send({user: username, message: 'User registered successfully' });
  });
});

})
  
});

app.get("/validate", validateToken, (req, res) => {
  res.send({message: "GOODS"})
})
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if(err){
      res.status(500).json({message: "ERROR OCCURED UPON REGISTERING"})
    } else {
      res.clearCookie('access-token');
      res.clearCookie('connect.sid');
      res.status(200).json({loggedIn: false});
    }
  })
})


app.get("/login", (req, res) => { 
  if(req.session.user) {
    res.send({ loggedIn: true, 
      user: req.session.user,
      role: req.session.role,
      cartCount: req.session.cartCounter 
    })
  } else {
    res.send({loggedIn: false})
  }
})

app.post("/login", (req, res) => {
   const username = req.body.username;
   const password = req.body.password;

   db.query(
     "SELECT * FROM users WHERE username = ?",
     [username],
     (err, result) => {
       
      if(err) {
        res.send({err: err})
       } 
          
       if (result.length > 0)
          {
              bcrypt.compare(password, result[0].password, (error, responsePass) => {
                          if(error) {
                            return res.send({err: error})
                          }

                   if(responsePass)
                   {
                    const User = result[0].username;
                    req.session.role = result[0].role;
                    req.session.user = User;
                    req.session.cartCounter = result[0].cartCounter;
                     const accessToken = createToken(User);
                     
                     res.cookie("access-token", accessToken, {
                      httpOnly: true
                     })
                     res.send({
                      message: "LOGGED IN!",
                      Authorize: true,
                      username,
                      accessToken,
                      result
                    })

                   } else {
                    res.send({message: 'wrong combination'})
                   }
              })
          } else {
            res.send({message: "Account not found"})
          }
    

     }
   )
})
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
