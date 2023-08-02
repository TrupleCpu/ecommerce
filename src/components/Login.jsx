import React, {useEffect, useState} from 'react'
import axios from 'axios'
import Upload from './Upload'
import { useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
const Login = () => {
     
     
    axios.defaults.withCredentials = true;
 
    const {signin} = UserAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
 
     
const navigate = useNavigate();

const loggedIn = window.localStorage.getItem('user');

     useEffect(() => {
         if(loggedIn) {
            navigate('/Account')
         } 
     }, [])
 const handleSubmit = async (e) => {
    e.preventDefault()
    try {
        await signin(username, password)
        navigate('/Account')
    } catch(error) {
        console.log(error)
    }
 }


  return (
    <>
    <form onSubmit={handleSubmit}>
    <label>Username:</label>
    <input onChange={(e) => setUsername(e.target.value)} /><br></br>
    <label>Password:</label>
    <input onChange={(e) => setPassword(e.target.value)} /><br></br>
    <input type="submit" value='Login' />
</form>


</>
  )
}

export default Login