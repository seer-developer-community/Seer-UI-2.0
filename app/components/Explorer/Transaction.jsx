import React from "react";


class Transaction extends React.Component {

  render(){
    let txId = this.props.params.tx_id;
    return (
      <div>{txId}</div>
    );
  }
}


export default Transaction;