import React from 'react'
import Upload from './Upload'
import axios from 'axios';
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';
import Products from './Products';
function Account() {
    
   const Navigate = useNavigate();

   const { user, role } = UserAuth();



  
    const logout = () => {
     axios.post("http://localhost:3001/logout")
     .then((response) => {
      console.log(response.data)
      localStorage.removeItem('user')
      return  Navigate('/login');
     })

 

    
  }
  return (
    <>
    <div> username: {user ? user : null}</div>
    <p>Status: {user ? 'online' : 'offline'}</p>
    <p>Role: {role ? role : null}</p>
    <button onClick={logout}>  Log Out</button>
    {role === 'seller' ? <Upload /> : <Products />}
    </>
  )
}

export default Account