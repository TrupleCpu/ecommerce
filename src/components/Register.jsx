import React, {useState, useEffect} from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
 
     
const navigate = useNavigate();
const loggedIn = window.localStorage.getItem('user');


   const { createUser } = UserAuth();

    const handleSubmit = async (e) => {
       e.preventDefault()
       try {
           await createUser(username, password)
           navigate('/login')
       } catch(error) {
           console.log(error)
       }
    }

    useEffect(() => {
        loggedIn ? navigate('/Account') : navigate('/');
    }, [])
    return (
        <form onSubmit={handleSubmit}>
            <label>Username:</label>
            <input onChange={(e) => setUsername(e.target.value)} /><br></br>
            <label>Password:</label>
            <input onChange={(e) => setPassword(e.target.value)} /><br></br>
            <input type="submit" value='Sign Up' />
        </form>
    )
}

export default Register