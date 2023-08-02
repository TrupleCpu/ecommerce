import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { UserAuth } from '../context/AuthContext';
import Transactions from './Transactions';

const socket = io('http://localhost:3002');

function Billing() {
     
     const {user} = UserAuth();
    const loggedIn = window.localStorage.getItem('user');
    const navigate = useNavigate();
    const [payment, setPayment] = useState('')
    const [creditNumber, setcreditNumber] = useState('')
    const [cardBrand, setCardBrand] = useState('')
    const [checkedAddress, setChecked] = useState(false);
    const [addtoCart, setAddtoCart] = useState([])
    const [address, setAdress] = useState('');
    const [postalCode, setPostalCode] = useState();
    const [phoneNUmber,setPhoneNumber] = useState();
   
    let paymentMethod = ['Gcash', 'Paypal', 'COD', 'CreditCard']
    
    useEffect(() => {
      socket.on('checkedOut', ({user})=>{
        setAddtoCart([])
      })
    }, [user])

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
   
   
    
    useEffect(() => {
        if(!loggedIn) {
            navigate('/Login')
        }
    })
    
    const handlePayment = (e) => {
        setPayment(e.target.value)
    }
  const handleCreditChange = (e) => {;
    const creditNumberWithoutHyphens = e.target.value.split('-').join('');
    setcreditNumber(creditNumberWithoutHyphens);
  }
 
  const keyDownCreditChange = (e) => {
     if(e.key === '-'){
       e.preventDefault();
     }
  }

  const fetchCreditData = async () => {
     if(creditNumber !== '' || null) {
         
        const response = await fetch(`https://bin-ip-checker.p.rapidapi.com/?bin=${creditNumber}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': 'b5f110c243mshca00bd05570f0f5p1e67cfjsn0610fc34bd36',
          'X-RapidAPI-Host': 'bin-ip-checker.p.rapidapi.com'
        },
        body: JSON.stringify({ bin: creditNumber }) // Make sure to stringify the body
      });

      try {
        const data = await response.json();
        setCardBrand(data.BIN.brand)
        console.log(data)
      } catch (error) {
        console.error(error)
      }
     }
 }
  useEffect(() => {
    fetchCreditData()
  }, [creditNumber])
    
  const handleCheck = (e) => {
    setChecked((prevState) => !prevState)
  } 
  const totalItems = () => {
      let totalItem = 0;
      addtoCart.forEach(item => {
        totalItem += item.total;
      })
      return totalItem;
  }

  const checkout = () => {
    const checkedOutItems = {
      address: address,
      postalCode: postalCode,
      phoneNUmber: phoneNUmber,
      paymentMethod: payment,
      addtoCart: addtoCart
    }
    axios.post('http://localhost:3001/checkout', checkedOutItems)
    .then((response) => {
      console.log(response.data)
    }).catch((error)=>{
      console.log(error )
    })
  }
  

  return (
    
    <>
    <h1>Your Cart:</h1>
    {addtoCart.map((items, index) => {
      return items.status !== 'sold' && (
        (
          <div key={index}>
                  <img style={{width: '20vh'}} src={items.imageurl} />
                  <p>Product Id: {items.idproduct}</p>
                  <p>Product Name: {items.itemname}</p>
                  <p>Price: ${items.itemprice}</p>
                  <p>Quantity: {items.itemquantity}</p>
                  <p>Total: ${items.total}</p>
                 </div>
                )
      )
    })}
    <p>Total: ${totalItems()}</p>
    <input 
    value={address}
onChange={(e) => setAdress(e.target.value)}
     placeholder=' address'/><br></br>
    <input 
     value={postalCode}
    onChange={(e) => setPostalCode(e.target.value)}
    placeholder='postal code' />
    <input 
    value={phoneNUmber}

onChange={(e) => setPhoneNumber(e.target.value)}
    type='telephone'
     placeholder='phone number' /><br></br>
    <label htmlFor='paymentMethod'>Payment Method: </label>
   <select style={{overflowX: 'hidden'}} id='paymentMethod' value={payment} onChange={handlePayment} >
   <option>Select Payment Options</option>
    {paymentMethod.map((method, index) => {
        return (
            <option key={index} value={method}>{method}</option>
        )
    })}
   </select><br></br>
   {payment === 'Gcash' && (
    <input type='' 
    placeholder='Gcash number'/>
   )}
{payment === 'Paypal' && (
    <input type='' 
    placeholder='Paypal Email Address'/>
   )}
   {payment === 'CreditCard' && (
   <>
    <input type='number'
     value={creditNumber} 
     onChange={handleCreditChange} 
     onKeyDown={keyDownCreditChange}
     placeholder='credit card number'/>
    <p>{cardBrand}</p>
   </>    
  )}
    <button onClick={checkout}>Checkout</button>
    <Transactions />

    </>
  )
}

export default Billing