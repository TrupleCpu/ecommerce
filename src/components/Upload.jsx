import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserAuth } from '../context/AuthContext';

function Upload() {
    
  const { user } = UserAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [productPrice, setProductPrice] = useState(0);
  const [productName, setProductName] = useState('')
  const [productQuantity, setProductQuantity] = useState(0);
  const [seller, setSeller] = useState([])
  const sellerName = user;
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
/* 
Retrieve The Data from the buy products ^_^
*/
         
  const handleFileUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('sellerName', sellerName)
      formData.append('productName', productName);
      formData.append('productPrice', productPrice);
      formData.append('productQuantity', productQuantity);


      await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('File uploaded successfully.');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  useEffect(() => {
    axios
    .get('http://localhost:3001/buy')
      .then((response) => {
        console.log(response.data)
        setSeller(response.data)
       
      })
      .catch((error) => {
        console.log(error);
      });

    
  }, [])
  return (
    <div>
    <h1>File Upload</h1>
    <input type="file" name="image" onChange={handleFileChange} /><br></br>
    <input type='text' value={productName} onChange={(e) => setProductName(e.target.value)} placeholder='set product name' /><br></br>
    <input type='number' value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder='Set Price' /><br></br>
    <input type='number' value={productQuantity} onChange={(e) => setProductQuantity(e.target.value)} /><br></br>
    <button onClick={handleFileUpload}>Upload</button>
  
    <table>
      <tbody>
      <tr>
        <th>Product</th>
        <th>Product Name</th>
        <th>Product Price</th>
        <th>Product Quantity</th>
        <th>Buyer Name</th>
        <th>Total</th>
        <th>Status</th>
      </tr>
      {seller.map(seller => {
        return seller.sellername === user ? (
           <tr key={seller.idbuyer}>
              <td><img style={{width: '10vh', height: '10vh'}} src={seller.imageurl} /></td>
              <td>{seller.itemname}</td>
              <td>{seller.itemprice}</td>
              <td>{seller.itemquantity}</td>
              <td>{seller.buyername}</td>
              <td>${seller.total}</td>
              <td><button>Approve</button></td>
            </tr>
        ): (
<React.Fragment  key={seller.idbuyer}/>  
        )
      })}
      </tbody>
    </table>
  </div>
  )
}

export default Upload