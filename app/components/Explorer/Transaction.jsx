import React from "react";


class Transaction extends React.Component {

  render(){
    let txId = this.props.params.tx_id;
    return (
      <div style={{padding:30}}>

        <table>
          <tr>
            <td width="54px">
              <span style={{fontSize:28,fontWeight:"bold",color:"#0C0D26"}}>Tx</span>
            </td>
            <td>
              <span style={{fontSize:24,color:"#666"}}>40319e2fbcdf95499bb87fad2b039cef95aec420@37391154{txId}</span>
            </td>
          </tr>
          <tr height={40}>
            <td></td>
            <td>
              <span style={{fontSize:16,color:"#999"}}>Included in block  <span style={{color:"#000",fontWeight:"bold"}}>37,391,154</span>  at 2019-05-13 01:52 (UTC)</span>
            </td>
          </tr>
        </table>

        <div>


        </div>
          {txId}
      </div>
    );
  }
}


export default Transaction;