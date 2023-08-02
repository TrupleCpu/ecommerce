import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:3002');
function Products() {
  const { user, countCart, setCountCart } = UserAuth();
   const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  let [newQuantity, setNewQuantity] = useState(0);
  let [items, setItems] = useState(0);
  const [click, setClick] = useState(false)
  const [id, setIdItems] = useState('')
  const [addtoCart, setAddtoCart] = useState([])
  const [addtoCartData, setAddtoCartData] = useState([])
  const [focusRef, setfocusRef] = useState({});
useEffect(() => {
  socket.on('checkedOut', ({user}) => {
   setAddtoCart([]);
  })
}, [user])

  useEffect(() => {
    // Fetch initial products
    axios
      .get('http://localhost:3001/products')
      .then((response) => {
        console.log(response.data.result)
        setProducts(response.data.result)
        

        const refs = {};
        response.data.result.forEach(product => {
          refs[product.id] = React.createRef();
        })
        setfocusRef(refs);

        const productsWithUsersQuantity = response.data.result.map(product => ({
          ...product,
          usersQuantity: 0
        }));
        setProducts(productsWithUsersQuantity);
      })
      .catch((error) => {
        console.log(error);
      });

    socket.on('newProduct', (data) => {
      console.log(data)
      setProducts((prevProducts) => [...prevProducts, { ...data ,usersQuantity: 0}])
    });
    
    return () => {
      socket.off('newProduct');
    };
  }, []);
useEffect(() => {
   socket.on('productQuantity', (data) => {
    console.log(data)
    
   })
   return () => {
    socket.off('productQuantity')
   }
}, [])

 const Increment = (productID, productQuantity) => {
  setProducts(prevProducts =>
    prevProducts.map(product => {
      if (product.id === productID) {
        return { ...product, usersQuantity: product.usersQuantity += 1 };
      }
      return product;
    })
  );
  setIdItems(productID)
  setNewQuantity(productQuantity)
};
const Decrement = (productID, productQuantity) => {
  setProducts(prevProducts =>
    prevProducts.map(product => {
      if (product.id === productID) {
        return { ...product, usersQuantity: product.usersQuantity -= 1 };
      }
      return product;
    })
  );
  setIdItems(productID)
  setNewQuantity(productQuantity)
};
  const focusChange = (productID, productQuantity) => () => {
    const product = products.find(product => product.id === productID)
    setIdItems(productID)
    setNewQuantity(productQuantity)
   }
   

   const handleQuantityChange = (productID, usersQuantity)  => {
     setProducts(prevProducts => prevProducts.map(product => {
      if(product.id === productID) {
        return {...product, usersQuantity} 
         }
         return product;
     }))
     
  }

  //Buy

  
  useEffect(() => {
    axios
    .get('http://localhost:3001/cart')
    .then((response) => {
        console.log(response.data)
        setAddtoCart(response.data)
       
    }).catch((error) => {
      console.log(error)
    })
    socket.on('newCart', (data) => {
      console.log(data)
      setAddtoCart((prevCart) => [...prevCart, data])
    })

    return () => {
      socket.off();
    }
  }, [])
 
  
   

   const AddtoCart = (productID, productQuantity, userQuantity) => {
    setIdItems(productID)
    setNewQuantity(productQuantity)
    
    if(userQuantity <= 0) {
      alert("ERROR!!!!!")
      return;
    } else if (userQuantity > productQuantity) {
      alert("DONT HAVE ENOUGH STOCKS!")
      return;
    } 
    const productToBuy = products.find(product => product.id === id)
    const idproduct = productToBuy.id;
    const buyername = user;
    const sellername = productToBuy.sellerName;
    const itemname = productToBuy.productName;
    const itemprice = productToBuy.productPrice;
    const itemquantity = productToBuy.usersQuantity;
    const itemtotalquantity = productToBuy.productQuantity;
    const imageurl = productToBuy.productURL;
    const total = productToBuy.productPrice * productToBuy.usersQuantity;
    const requestData = {idproduct, buyername, sellername, itemname, itemprice, itemquantity, itemtotalquantity, imageurl, total }



 axios.post('http://localhost:3001/cart', requestData)
    .then((response) => {
       console.log(response)
       socket.emit('clearCart', { buyername: buyername})
      }).catch((error) => {
       console.log(error)
    })

  }
   
  const calculateTotal = () => {
    let total = 0;
    addtoCart.forEach((item) => {
      if(item.buyername === user){
        total += item.total
      }
    })
    return total;
  }

  const checkoout = () => {
     navigate('/Billing')
    
   
  }
const remove = (cartID, buyername, totalQuantity, itemquantity) => {
  const id = cartID;
  const user = buyername;
   
   
  axios.post("http://localhost:3001/delete", {id: id, user: user})
  .then((response) => {
    console.log(response.data)
   const updatedCart = addtoCart.filter((cartitem) => cartitem.idcart !== cartID || cartitem.buyername !== buyername)
   setAddtoCart(updatedCart)
   
   setCountCart(countCart - 1)
  }).catch((error) => {
    console.log(error)
  })

}
  return (
    <div style={{display: 'flex', gap: 50}}>
    <div style={{display: 'flex', gap: 50}}>
      {products.map((product) => (
        <div key={product.id}>
          <img style={{  height: '10vh' }} src={product.productURL} alt="Product" />
          <p>Seller: {product.sellerName}</p>
          <p>Product: {product.productName}</p>
          <p>Price: ${product.productPrice}</p>
          <p>Quantity: { product.productQuantity} items available</p><br></br>
          <input ref={focusRef[product.id]} type='number' value={product.usersQuantity && product.usersQuantity > 0 ? product.usersQuantity : 0} onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))} onFocus={focusChange(product.id, product.productQuantity)} />
         <button style={{fontWeight: 900}} onClick={() => Increment(product.id, product.productQuantity)}>+</button><br></br>
         <button style={{fontWeight: 900}} onClick={() => Decrement(product.id, product.productQuantity)}>-</button><br></br>

        {!product.productQuantity <= 0 ? (
          <>
          <button onClick={() => AddtoCart(product.id, product.productQuantity, product.usersQuantity)}>Add To Cart</button>
          </>
        ): (
           <p>Sold Out!</p>
        )}
        </div>
      ))}
    </div>
<div>
      <h1>Add To Cart Item List</h1>
      <p style={{display: 'flex', gap: 5}}><span className="material-symbols-outlined">
shopping_cart
</span>{countCart}</p>
<p>Total: ${calculateTotal()}</p>
      {addtoCart.map((cart, index) => {
        return cart.buyername === user ? (
            <div key={index} style={{marginBottom: 10}}>
            <img style={{height: '10vh'}} src={cart.imageurl} />
            <p>Item Price: ${cart.itemprice}</p>
            <p style={{marginBottom: -20}}>Quantity: {cart.itemquantity}</p>
            <button style={{marginLeft: '8rem'}} onClick={() => remove(cart.idcart, cart.buyername, cart.itemtotalquantity, cart.itemquantity)}>-</button>
           </div>
           
        ):(
          <React.Fragment key={index} />
        )
      })}
 {addtoCart.length > 0 && (
 <button onClick={() => checkoout(products, addtoCart)}>Check Out</button>
)}
    </div>
    </div>
  )
}

export default Products