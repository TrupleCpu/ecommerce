import { useEffect, useState } from 'react'
import Login from './components/Login'
import './App.css'
import Register from './components/Register';
import Account from './components/Account';
import { BrowserRouter, Route, Routes, Router, useNavigate } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import Protectedroute from './components/Protectedroute';
import Billing from './components/billing';
import axios from 'axios';
function App() {
  const loggedIn = window.localStorage.getItem('user');
  const Navigate = useNavigate();
 

return (

 <AuthContextProvider>
    <Routes>
      <Route path='/' element={<Register />} />
    <Route
     path='/Account' 
    element={ loggedIn ? <Account /> :  <Protectedroute>
    <Account />
  </Protectedroute>} />
    <Route path='/Login' element={<Login />} />
    <Route path='/Billing' element={<Billing />} />
    </Routes>
 </AuthContextProvider>
  )
}

export default App
