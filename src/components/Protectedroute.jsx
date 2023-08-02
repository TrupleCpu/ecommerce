import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext';
function Protectedroute({children}) {
    const { log, userState } = UserAuth();
      
    return log || userState ? children : <Navigate to='/login' />
}

export default Protectedroute