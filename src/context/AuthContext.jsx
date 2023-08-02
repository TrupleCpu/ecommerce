import { createContext, useContext , useEffect, useState} from "react";
import axios from "axios";
import { io } from 'socket.io-client'

export const UserContext = createContext();
const socket = io('http://localhost:3002');

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState('')
    const [log, setLog] = useState(false);
     const [userState, setUserState] = useState();
     const [status, setStatus] = useState(false)
     const loggedIn = window.localStorage.getItem('user');
     const [countCart, setCountCart] = useState(0)
     const [role, setRole] = useState('');
axios.defaults.withCredentials = true;

   const createUser = (username, password) => {
     return  axios.post("http://localhost:3001/register", {
            username,
            password
        }).then((response) => {
            console.log(response.data)
            setUser(response.data.user)
        }).catch((error) => {
            console.log(error);
        })
   }

   const signin = (username, password) => {
    return axios.post("http://localhost:3001/login", {
        username,
        password
    }).then((response) => {
        console.log(response.data)
        setUser(response.data.username)
               if(response.data.Authorize === true) {
                setLog(true)
                setStatus(true)
                setRole(response.data.result[0].role)
                setCountCart(response.data.result[0].cartCount)

              setUserState(localStorage.setItem('user', response.data.accessToken));
               } else {
                setLog(false)
               }
    }).catch((error) => {
        console.log(error)
    })
   }

   useEffect(() => {
    axios.get("http://localhost:3001/login").then((response) => {
        console.log(response.data)
        setUser(response.data.user)
        setStatus(true)
        setRole(response.data.role)

       
      }).catch((error) => console.log(error))
   }, [])
    useEffect(() => {
        axios.get("http://localhost:3001/cartCounter")
        .then((response) => {
            setCountCart(response.data[0].cartCounter)

        }).catch((error) => {
            console.log(error)
        })

        socket.on('cartCounter', (data) => {
            setCountCart(data)

        })
        return () => {
            socket.off();
        }
    })
   
   
  return (
       <UserContext.Provider value={{createUser, user, signin, log, userState, role, countCart, setCountCart}}>
        {children}
       </UserContext.Provider>
  )
}

export const UserAuth = () => {
    return useContext(UserContext);
}
