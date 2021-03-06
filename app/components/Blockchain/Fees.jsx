import React from "react";
import Immutable from "immutable";
import counterpart from "counterpart";
import classNames from "classnames";
import Translate from "react-translate-component";
import HelpContent from "../Utility/HelpContent";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import {ChainStore, ChainTypes as grapheneChainTypes} from "seerjs/es";
const {operations} = grapheneChainTypes;
let ops = Object.keys(operations);

// Define groups and their corresponding operation ids
let fee_grouping = {
    general  : [0,22,23,24,25,29,30,33,35,36,37,39,55],
    asset    : [9,10,11,12,13,34,38,62],
    market   : [1,2,3],
    account  : [4,5,6,7,8],
    business : [14,15,16,17,18,19,20,21,26,27,28,31,32,56,57,58,59,60,61],
    seer      : [40,41,42,43,44,45,46,47,48,49,50,51,52,53,54]
};

// Operations that require LTM
let ltm_required = [4, 6, 14, 15];

class FeeGroup extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0",
    };

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.globalObject, this.props.globalObject)
        );
    }

    render() {
        let {globalObject, settings, opIds, title} = this.props;
        globalObject = globalObject.toJSON();
        const core_asset = ChainStore.getAsset("1.3.0");

        let current_fees = globalObject.parameters.current_fees;
        let scale   = current_fees.scale;
        let feesRaw = current_fees.parameters;
        let preferredUnit = settings.get("unit") || core_asset.get("symbol");

        let trxTypes = counterpart.translate("transaction.trxTypes");

        let fees = opIds.map((feeIdx) => {
            if (feeIdx >= feesRaw.length) {
                console.warn("Asking for non-existing fee id %d! Check group settings in Fees.jsx", feeIdx);
                return; // FIXME, if I ask for a fee that does not exist?
            }

            let feeStruct = feesRaw[feeIdx];

            let opId      = feeStruct[0]
            let fee       = feeStruct[1]
            let operation_name = ops[ opId ];
            let feename        = trxTypes[ operation_name ];

            let feeRateForLTM =  globalObject.parameters.network_percent_of_fee/1e4
            if (opId === 9) {
                // Asset creation fee for LTM is 60% of standart user
                // See https://github.com/bitshares/bitshares-ui/issues/996
                feeRateForLTM = 0.5+(1-feeRateForLTM)/2
            }

            let rows = []
            let headIncluded = false
            let labelClass = classNames("label", "info");

            for (let key in fee) {
                let amount = fee[key]*scale/1e4;
                let amountForLTM = amount * feeRateForLTM
                let feeTypes = counterpart.translate("transaction.feeTypes");
                let assetAmount = amount ? <FormattedAsset amount={amount} asset="1.3.0"/> : feeTypes["_none"];
                let equivalentAmount = amount ? <EquivalentValueComponent fromAsset="1.3.0" fullPrecision={true} amount={amount} toAsset={preferredUnit} fullDecimals={true}/> : feeTypes["_none"];
                let assetAmountLTM = amountForLTM ? <FormattedAsset amount={amountForLTM} asset="1.3.0"/> : feeTypes["_none"];
                let equivalentAmountLTM = amountForLTM ? <EquivalentValueComponent fromAsset="1.3.0" fullPrecision={true} amount={amountForLTM} toAsset={preferredUnit} fullDecimals={true}/> : feeTypes["_none"];
                let title = null;

                if (!headIncluded) {
                    headIncluded = true
                    title = (<td rowSpan="6" style={{width:"15em"}}>
                        <span className={labelClass} style={{borderRadius:"5px"}}>
                            {feename}
                        </span>
                    </td>)
                }

                if (ltm_required.indexOf(opId)<0) {
                    rows.push(
                        <tr key={opId.toString() + key} className={feeTypes[key]==="Annual Membership" ? "linethrough" : ""}>
                            {title}
                            <td>{feeTypes[key]}</td>
                            <td style={{textAlign: "right"}}>{assetAmount}{amount !== 0 && preferredUnit !== "SEER" && [" / ", equivalentAmount]}</td>
                            <td style={{textAlign: "right"}}>{feeIdx !== 8 ? assetAmountLTM : null}{feeIdx !== 8 && amount !== 0 && preferredUnit !== "SEER" && [" / ", equivalentAmountLTM]}</td>
                        </tr>
                    );
                } else {
                    rows.push(
                        <tr key={opId.toString() + key}>
                            {title}
                            <td>{feeTypes[key]}</td>
                            <td style={{textAlign: "right"}}>- <sup>*</sup></td>
                            <td style={{textAlign: "right"}}>{assetAmountLTM}{amount !== 0 && preferredUnit !== "SEER" && [" / ", equivalentAmountLTM]}</td>
                        </tr>
                    );
                }
            }
            return (<tbody key={feeIdx}>{rows}</tbody>);
        })

        return (
            <div className="asset-card">
                <table className="table dashboard-table even-bg">
                    <thead>
                        <tr>
                            <th><Translate content={"explorer.block.op"} /></th>
                            <th><Translate content={"explorer.fees.type"} /></th>
                            <th style={{textAlign: "right"}}><Translate content={"explorer.fees.fee"} /></th>
                            <th style={{textAlign: "right"}}><Translate content={"explorer.fees.feeltm"} /></th>
                        </tr>
                    </thead>
                    {fees}
                </table>
            </div>
        );
    }
}
FeeGroup = BindToChainState(FeeGroup, {keep_updating:true});

class Fees extends React.Component {

    constructor(){
        super();
        this.state = {
          currentFeeIds:null,
          currentGroupName:null,
          currentGroupNameText:null
        }
    }

    typeSelect(groupName,feeIds,groupNameText){
        this.setState({
          currentGroupName:groupName,
          currentFeeIds:feeIds,
          currentGroupNameText:groupNameText
        });
    }

    render() {

        let FeeGroupsTitle  = counterpart.translate("transaction.feeGroups");
        let feeGroups = [];

        let typesButton = [];

        for (let groupName in fee_grouping) {
            let groupNameText = FeeGroupsTitle[groupName];
            let feeIds = fee_grouping[groupName];
            feeGroups.push(<FeeGroup key={groupName} settings={this.props.settings} opIds={feeIds} title={groupNameText}/>);


            if(!this.state.currentFeeIds){
                this.state.currentFeeIds = feeIds;
                this.state.currentGroupName = groupName;
                this.state.currentGroupNameText = groupNameText;
            }

            if(this.state.currentGroupName === groupName){
              typesButton.push(
                <div key={groupName} onClick={e=>{this.typeSelect(feeIds)}} style={{display:"inline-block",width:99,height:35,lineHeight:"35px",
                                                    fontSize:"14px",textAlign:"center",background:"#E1F1EB",
                                                    borderRadius:"3px",color:"#666",
                                                    marginBottom:"10px"}}>
                  {groupNameText}
                </div>
              );
            }else{
              typesButton.push(
                <div key={groupName} onClick={e=>{this.typeSelect(groupName,feeIds,groupNameText)}} style={{display:"inline-block",width:99,height:35,lineHeight:"35px",
                                                                                    fontSize:"14px",textAlign:"center",color:"#666",marginBottom:"10px"}}>
                  {groupNameText}
                </div>
              );
            }
        }

        return(
          <div>
              <div style={{padding:"30px 27px 8px 27px"}}>
                <HelpContent path = {"components/Fees"} />
              </div>

            <h1 style={{backgroundColor:"#f2f2f2",height:"18px",marginTop:30,marginBottom:30}}>&nbsp;</h1>

            <table width="100%">
                <tr>
                    <td width="171px" style={{verticalAlign:"top"}}>
                        <div style={{textAlign:"center"}}>
                          {typesButton}
                        </div>
                    </td>
                    <td style={{verticalAlign:"top"}}>
                      <FeeGroup key={this.state.currentGroupName} settings={this.props.settings} opIds={this.state.currentFeeIds} title={this.state.currentGroupNameText}/>
                    </td>
                </tr>
            </table>
          </div>
        );
    }
}

export default Fees;
