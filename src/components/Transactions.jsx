import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
function Transactions() {
    
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:3001/transactions")
        .then((response) => {
            console.log(response.data)
            setTransactions(response.data)
        }).catch((error) => {
            console.log(error)
        })
    },[])
  return (
   <>
   <h1>Recent Transactions:</h1>
   {transactions.map((transaction, index) => {
    return (
        <div key={index} style={{display: 'flex', gap: 20}}>
         <p>transaction id: {transaction.idtransactions}</p>   
         <p>Product Name: {transaction.productName}</p>
         <p>Sellername: {transaction.sellername}</p>
         <p>Quantity: {transaction.quantity}</p>
         <p>Price: ${transaction.price}</p>
         <p>Date Purchased: {transaction.date} at {transaction.time}</p>
         <p>Total: ${transaction.total}</p>
        </div>
    )
   })}
   </>
  )
}

export default Transactions