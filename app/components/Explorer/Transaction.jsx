import React from "react";
import TransactionOperation from "../Blockchain/TransactionOperation";
import Icon from "../Icon/Icon";
var Apis =  require("seerjs-ws").Apis;

class Transaction extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      transaction:null
    };
  }

  componentWillMount() {
    Apis.instance().db_api().exec("get_transaction_by_txid", [this.props.params.tx_id]).then((results) => {
      if (results && results.block_num) {
        Apis.instance().db_api().exec("get_block", [results.block_num]).then((rs) => {
          if (rs.transaction_ids && rs.transaction_ids.length > 0) {
            let index = rs.transaction_ids.indexOf(this.props.params.tx_id);
            let tx = rs.transactions[index];
            tx.timestamp = results.timestamp;
            tx.block_num = results.block_num;
            tx.transaction_id = this.props.params.tx_id;

            this.setState({
              transaction: tx
            });
          }
        });
      }
    });
  }

  format(num){
    return (num + '').replace(/\d{1,3}(?=(\d{3})+$)/g, '$&,');
  }

  render(){
    let txId = this.props.params.tx_id;
    let { transaction } = this.state;

    if(!transaction){
      return (
        <div style={{padding:30}}>
          transaction not found
        </div>
      );
    }

    let fmBlockNum = (transaction.block_num + '').replace(/\d{1,3}(?=(\d{3})+$)/g, '$&,');

    let date =  new Date(transaction.timestamp);
    let dateStr = date.getFullYear() + "-" + (('0' + (date.getMonth() + 1)).slice(-2)) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    let opResult = transaction.operation_results[0].map((val,index) => {
      console.log(val);
      if(typeof val === "object" || typeof val === "array"){
        return (
          <div key={index}>{index}. &nbsp;{JSON.stringify(val)}</div>
        )
      }else{
        return (
          <div key={index}>{index}. &nbsp;{val}</div>
        )
      }
    });
    console.log(opResult);
    console.log(transaction);
    console.log(JSON.stringify(transaction));
    return (
      <div style={{padding:30}}>
        <table>
          <tr>
            <td width="54px">
              <span style={{fontSize:28,fontWeight:"bold",color:"#0C0D26"}}>Tx</span>
            </td>
            <td>
              <span style={{fontSize:24,color:"#666"}}>{txId}@{transaction.block_num}</span>
            </td>
          </tr>
          <tr height={40}>
            <td></td>
            <td>
              <span style={{fontSize:16,color:"#999"}}>Included in block  <span style={{color:"#000",fontWeight:"bold"}}>{fmBlockNum}</span>  at {dateStr} (UTC)</span>
            </td>
          </tr>
        </table>

        <TransactionOperation
          op={transaction.operations[0]}
          result={transaction.operation_results[0]}
          block={transaction.block_num}
          hideFee={true}
          withTxId={true}
          txId={transaction.transaction_id}
          hideOpLabel={false}
          current={"1.2.0"}
        />

        <h6 style={{fontWeight:"bold",color:"#0C0D26",margin:"26px 0"}}>Show raw transaction <Icon className="icon-28px" name="arrow_down" style={{position:"relative",top:8}}/></h6>

        <table className="table tx-table" style={{width:"100%",overflow:"hidden"}}>
          <tbody>
            <tr>
              <td width="180px">ref_block_num</td>
              <td colSpan={2}>{this.format(transaction.ref_block_num)}</td>
            </tr>
            <tr>
              <td>ref_block_prefix</td>
              <td colSpan={2}>{this.format(transaction.ref_block_prefix)}</td>
            </tr>
            <tr>
              <td>expiration</td>
              <td colSpan={2}>"{transaction.expiration}"</td>
            </tr>
            <tr className="no-boder">
              <td>operations</td>
              <td width="188px">fee</td>
              <td>
                <div>amount &nbsp;{this.format(transaction.operations[0][1].fee.amount)}</div>
                <div>asset_id &nbsp;"{this.format(transaction.operations[0][1].fee.asset_id)}"</div>
              </td>
            </tr>
            <tr className="no-boder">
              <td></td>
              <td>seller</td>
              <td>
                "{transaction.operations[0][1].from}"
              </td>
            </tr>
            <tr>
              <td></td>
              <td>amount_to_sell</td>
              <td>
                <div>amount &nbsp;{this.format(transaction.operations[0][1].amount.amount)}</div>
                <div>asset_id &nbsp;"{this.format(transaction.operations[0][1].amount.asset_id)}"</div>
              </td>
            </tr>
            <tr>
              <td>extensions</td>
              <td colSpan={2}>{JSON.stringify(transaction.extensions)}</td>
            </tr>
            <tr>
              <td>signatures</td>
              <td colSpan={2}>
                <div className="wrap">
                  0."{transaction.signatures}"
                </div>
              </td>
            </tr>
            <tr>
              <td>operation_results</td>
              <td colSpan={2}>
                {opResult}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}


export default Transaction;