import React from 'react'
import { UserAuth } from '../context/AuthContext'
import axios from 'axios';

function Buy({newQuantity = 0, iditems = null}) {
    const user = window.localStorage.getItem('user')

    const { role } = UserAuth();
    
 const handleclick = () => {
       axios.post('http://localhost:3001/update', newQuantity, iditems)
       .then((response) => {
          console.log(response.data)
       }).catch((error) => {
          console.log(error)
       })
 }
  return (
    <>
   {user &&  <button onClick={handleclick}>{role === "seller" ? "Seller" : "Buyer"}</button>}
   </>
  )
}

export default Buy