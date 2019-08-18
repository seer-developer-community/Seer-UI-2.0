import React from "react";
import {Link} from "react-router/es";
import BlockchainActions from "actions/BlockchainActions";
import Translate from "react-translate-component";
import {FormattedDate} from "react-intl";
import Operation from "../Blockchain/Operation";
import LinkToWitnessById from "../Utility/LinkToWitnessById";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import TransactionChart from "./TransactionChart";
import BlocktimeChart from "./BlocktimeChart";
import classNames from "classnames";
import utils from "common/utils";
import Immutable from "immutable";
import TimeAgo from "../Utility/TimeAgo";
import FormattedAsset from "../Utility/FormattedAsset";
import Ps from "perfect-scrollbar";
import TransitionWrapper from "../Utility/TransitionWrapper";
import {ChainStore} from "seerjs/es";

require("../Blockchain/json-inspector.scss");

class BlockTimeAgo extends React.Component {

    shouldComponentUpdate(nextProps) {
        return nextProps.blockTime !== this.props.blockTime;
    }

    render() {
        let {blockTime} = this.props;

        // let timePassed = Date.now() - blockTime;
        let timePassed = (new Date()).getTime() - (new Date(blockTime)).getTime();

        let textClass = classNames("txtlabel",
            {"success": timePassed <= 6000},
            {"info": timePassed > 6000 && timePassed <= 15000},
            {"warning": timePassed > 15000 && timePassed <= 25000},
            {"error": timePassed > 25000}
        );

        return (
            // blockTime ? <h3 className={textClass} ><TimeAgo time={blockTime} /></h3> : null
          blockTime ? <div className={textClass} style={{fontSize:"18px",marginTop:20}}><TimeAgo time={blockTime} /></div> : null
        );

    }
}

class Blocks extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired,
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0",
        dynGlobalObject: "2.1.0",
        coreAsset: "1.3.0",
        latestBlocks: {},
        assets: {},
        accounts: {},
        height: 1
    };

    constructor(props) {
        super(props);

        this.state = {
            animateEnter: false,
            operationsHeight: null,
            blocksHeight: null
        };

        this._updateHeight = this._updateHeight.bind(this);
    }

    _getBlock(height, maxBlock) {
        if (height) {
            height = parseInt(height, 10);
            BlockchainActions.getLatest(height, maxBlock);
        }
    }

    componentWillMount() {
        window.addEventListener("resize", this._updateHeight, {capture: false, passive: true});
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._updateHeight);
    }

    componentWillReceiveProps(nextProps) {


        if (nextProps.latestBlocks.size === 0) {
            return this._getInitialBlocks();
        } else if (!this.state.animateEnter) {
            this.setState({
                animateEnter: true
            });
        }

        let maxBlock = nextProps.dynGlobalObject.get("head_block_number");
        if (nextProps.latestBlocks.size >= 20 && nextProps.dynGlobalObject.get("head_block_number") !== nextProps.latestBlocks.get(0).id) {
            return this._getBlock(maxBlock, maxBlock);
        }
    }

    componentDidMount() {
        this._getInitialBlocks();
        let oc = this.refs.operations;
        Ps.initialize(oc);
        let blocks = this.refs.blocks;
        Ps.initialize(blocks);
        this._updateHeight();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.latestBlocks, this.props.latestBlocks) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    componentDidUpdate() {
        this._updateHeight();
    }

    _getInitialBlocks() {
        let maxBlock = parseInt(this.props.dynGlobalObject.get("head_block_number"), 10);
        if (maxBlock) {
            for (let i = 19; i >= 0; i--) {
                let exists = false;
                if (this.props.latestBlocks.size > 0) {
                    for (let j = 0; j < this.props.latestBlocks.size; j++) {
                        if (this.props.latestBlocks.get(j).id === maxBlock - i) {
                            exists = true;
                            break;
                        }
                    }
                }
                if (!exists) {
                    this._getBlock(maxBlock - i, maxBlock);
                }
            }
        }
    }

    _updateHeight() {
        let containerHeight = this.refs.outerWrapper.offsetHeight;
        let operationsTextHeight = this.refs.operationsText.offsetHeight;
        let blocksTextHeight = this.refs.blocksText.offsetHeight;

        this.setState({
            operationsHeight: containerHeight - operationsTextHeight,
            blocksHeight: containerHeight - blocksTextHeight
        }, this.psUpdate);
    }

    psUpdate() {
        let oc = this.refs.operations;
        Ps.update(oc);
        let blocks = this.refs.blocks;
        Ps.update(blocks);
    }

    render() {

        let {latestBlocks, latestTransactions, globalObject, dynGlobalObject, coreAsset} = this.props;
        let {blocksHeight, operationsHeight} = this.state;

        let blocks = null, transactions = null;
        let headBlock = null;
        let trxCount = 0, blockCount = latestBlocks.size, trxPerSec = 0, blockTimes = [], avgTime = 0;

        if (latestBlocks && latestBlocks.size >= 20) {

            let previousTime;

            let lastBlock, firstBlock;

            // Map out the block times for the latest blocks and count the number of transactions
            latestBlocks.filter((a, index) => {
                // Only use consecutive blocks counting back from head block
                return a.id === (dynGlobalObject.get("head_block_number") - index);
            }).sort((a, b) => {
                return a.id - b.id;
            }).forEach((block, index) => {
                trxCount += block.transactions.length;
                if (index > 0) {
                    blockTimes.push([block.id, (block.timestamp - previousTime) / 1000]);
                    lastBlock = block.timestamp;
                } else {
                    firstBlock = block.timestamp;
                }
                previousTime = block.timestamp;
            });

            // Output block rows for the last 20 blocks
            blocks = latestBlocks
            .sort((a, b) => {
                return b.id - a.id;
            })
            .take(20)
            .map((block,index) => {
                return (
                        <tr key={block.id} style={{height:42,borderBottom:"none"}}>
                            <td style={{background:(index % 2 === 0) ? "#f8f8fa" : "#fff" }}>
                              <Link to={`/block/${block.id}`}>#{utils.format_number(block.id, 0)}</Link>
                            </td>
                            <td style={{background:(index % 2 === 0) ? "#f8f8fa" : "#fff" }}>
                              <FormattedDate value={block.timestamp} format="time"/>
                            </td>
                            <td style={{background:(index % 2 === 0) ? "#f8f8fa" : "#fff" }}>
                              <LinkToWitnessById witness={block.witness} />
                            </td>
                            <td style={{background:(index % 2 === 0) ? "#f8f8fa" : "#fff" }}>
                              {utils.format_number(block.transactions.length, 0)}
                            </td>
                        </tr>
                    );
            }).toArray();

            let trxIndex = 0;

            transactions = latestTransactions.take(20)
            .map((trx) => {

                let opIndex = 0;
                return trx.operations.map(op => {
                    return (
                     <Operation
                            key={trxIndex++}
                            op={op}
                            result={trx.operation_results[opIndex++]}
                            block={trx.block_num}
                            hideFee={true}
                            hideOpLabel={false}
                            current={"1.2.0"}
                        />
                    );
                });

            }).toArray();

            headBlock = latestBlocks.first().timestamp;
            avgTime = blockTimes.reduce((previous, current, idx, array) => {
                return previous + current[1] / array.length;
            }, 0);

            trxPerSec = trxCount / ((lastBlock - firstBlock) / 1000);
        }

        let dynamic = null;
        if(this.props.coreAsset.toJS()){
            dynamic = ChainStore.getObject(this.props.coreAsset.toJS().dynamic_asset_data_id,false,false);
        }

        let gridValueStyle = {
            fontSize:"18px",
            color:"#0C0D26",
            fontWeight:"bold",
            marginTop:"20px"
        };

        return (
            <div ref="outerWrapper" className="grid-block vertical">

                {/* First row of stats */}
                    <div className="align-center grid-block shrink small-horizontal blocks-row" style={{marginTop:41}}>
                        <div className="grid-block text-center small-6 medium-2">
                            <div className="grid-content no-overflow">
                                <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.current_block" /></div>
                                <div style={gridValueStyle}>#{utils.format_number(dynGlobalObject.get("head_block_number"), 0)}</div>
                            </div>
                        </div>
                        <div className="grid-block text-center small-6 medium-2">
                            <div className="grid-content no-overflow">
                                <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.last_block" /></div>
                                  <BlockTimeAgo blockTime={headBlock} />
                            </div>
                        </div>
                        <div className="grid-block text-center small-6 medium-2">
                            <div className="grid-content no-overflow">
                                <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.trx_per_sec" /></div>
                                <div style={gridValueStyle}>{utils.format_number(trxPerSec, 2)}</div>
                            </div>
                        </div>
                        <div className="grid-block text-center small-6 medium-2">
                            <div className="grid-content no-overflow">
                                <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.avg_conf_time" /></div>
                                <div style={gridValueStyle}>{utils.format_number(avgTime / 2, 2)}s</div>
                            </div>
                        </div>
                      <div className="grid-block text-center small-6 medium-2">
                        <div className="grid-content no-overflow clear-fix">
                          <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.active_witnesses" /></div>
                          <div className="txtlabel success"  style={gridValueStyle}>
                            {globalObject.get("active_witnesses").size}
                          </div>
                        </div>
                      </div>

                      <div className="grid-block text-center small-6 medium-2">
                        <div className="grid-content no-overflow clear-fix">
                          <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.active_committee_members" /></div>
                          <div className="txtlabel success" style={gridValueStyle}>
                            {globalObject.get("active_committee_members").size}
                          </div>
                        </div>
                      </div>
                    </div>

                    { /* Second row of stats */ }
                    <div  className="align-center grid-block shrink small-horizontal  blocks-row" style={{marginTop:63}}>
                      <div className="grid-block text-center small-12 medium-2">
                        <div className="grid-content no-overflow clear-fix">
                          <div className="label-text color-8e8e8e">
                            <Translate component="span" content="explorer.asset.summary.current_supply" />
                            ({coreAsset.get("symbol")})
                          </div>
                          <div className="txtlabel" style={gridValueStyle}>
                            <FormattedAsset
                              amount={dynamic?dynamic.toJS().current_supply:0}
                              asset={coreAsset.get("id")}
                              hide_asset={true}
                              decimalOffset={5}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid-block text-center small-12 medium-2">
                        <div className="grid-content no-overflow clear-fix">
                          <div className="label-text color-8e8e8e">
                            <Translate component="span" content="explorer.asset.summary.stealth_supply" />
                            ({coreAsset.get("symbol")})
                          </div>
                          <div className="txtlabel" style={gridValueStyle}>
                            <FormattedAsset
                              amount={dynamic?dynamic.toJS().confidential_supply:0}
                              asset={coreAsset.get("id")}
                              hide_asset={true}
                              decimalOffset={5}
                            />
                          </div>
                        </div>
                      </div>
                        <div className="grid-block text-center small-6 medium-2">
                            <div className="grid-content no-overflow clear-fix">
                                <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.trx_per_block" /></div>
                                <div style={gridValueStyle}>{utils.format_number(trxCount / blockCount || 0, 2)}</div>
                            </div>
                        </div>
                        <div className="grid-block text-center small-6 medium-2">
                            <div className="grid-content no-overflow clear-fix">
                                <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.recently_missed_blocks" /></div>
                                <div className="txtlabel warning" style={{fontWeight: "100",...gridValueStyle}}>
                                    {dynGlobalObject.get("recently_missed_count")}
                                </div>
                            </div>
                        </div>
                      <div className="grid-block text-center small-12 medium-2">
                        <div className="grid-content no-overflow">
                          <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.block_times" /></div>
                          <BlocktimeChart blockTimes={blockTimes} head_block_number={dynGlobalObject.get("head_block_number")} />
                        </div>
                      </div>
                      <div className="grid-block text-center small-12 medium-2">
                        <div className="grid-content no-overflow">
                          <div className="label-text color-8e8e8e"><Translate component="span" content="explorer.blocks.trx_per_block" /></div>
                          <TransactionChart blocks={latestBlocks} head_block={dynGlobalObject.get("head_block_number")}/>
                        </div>
                      </div>
                    </div>

              <h1 style={{backgroundColor:"#f2f2f2",height:"18px",marginTop:"30px",marginBottom:0}}>&nbsp;</h1>

              <div style={{display:"flex",flexDirection:"row",width:"100%"}}>
                <div style={{flex:1,padding:7}}>
                  <div className="grid-block vertical no-overflow generic-bordered-box">
                    <div ref="operationsText">
                      <div ref="blocksText" className="flex-align-middle" style={{marginTop:10,paddingBottom:16,borderBottom:"1px solid #efefef"}}>
                        <div style={{display:"flex",width:42,height:42,justifyContent:"center",alignItems:"center"}}>
                          <svg className="icon" aria-hidden="true" style={{width:32,height:32}}>
                            <use xlinkHref="#icon-jilu1"></use>
                          </svg>
                        </div>
                        <Translate component="span" content="account.recent" style={{fontSize:16,color:"#0C0D26",fontWeight:"bold",marginLeft:2}}/>
                      </div>
                        <table className="table">
                          <thead>
                          <tr>
                            <th><Translate content="account.votes.info" /></th>
                          </tr>
                          </thead>
                        </table>
                      </div>
                      <div className="grid-block" style={{maxHeight: operationsHeight || "400px", overflow: "hidden", }} ref="operations">
                        <table className="table">
                          <tbody>
                          {transactions}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                <div style={{backgroundColor:"#f2f2f2",width:"18px"}}>
                 &nbsp;
                </div>
                <div style={{flex:1,padding:7}}>
                  <div className="grid-block vertical no-overflow generic-bordered-box">
                    <div ref="blocksText" className="flex-align-middle" style={{marginTop:10,paddingBottom:16,borderBottom:"1px solid #efefef"}}>
                      <svg className="icon" aria-hidden="true" style={{width:42,height:42}}>
                        <use xlinkHref="#icon-qukuailianxiangmu"></use>
                      </svg>
                      <Translate component="span" content="explorer.blocks.recent" style={{fontSize:16,color:"#0C0D26",fontWeight:"bold",marginLeft:2}}/>
                    </div>
                    <div className="grid-block vertical" style={{maxHeight: blocksHeight || "438px", overflow: "hidden", }} ref="blocks">

                      <table className="table dashboard-table">
                        <thead>
                        <tr>
                          <th style={{fontWeight:"bold"}}><Translate component="span" content="explorer.block.id" /></th>
                          <th style={{fontWeight:"bold"}}><Translate component="span" content="explorer.block.date" /></th>
                          <th style={{fontWeight:"bold"}}><Translate component="span" content="explorer.block.witness" /></th>
                          <th style={{fontWeight:"bold"}}><Translate component="span" content="explorer.block.count" /></th>
                        </tr>
                        </thead>

                        <TransitionWrapper
                          component="tbody"
                          transitionName="newrow"
                        >
                          {blocks}
                        </TransitionWrapper>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

            { /* Fourth row: transactions and blocks */ }
                <div ref ="transactionsBlock" className="grid-block no-overflow">

                    <div className="grid-block small-12 medium-6 vertical no-overflow" style={{paddingBottom: 0}}>

                    </div>
                    <div className="grid-block medium-6 show-for-medium vertical no-overflow" style={{paddingBottom: 0, paddingLeft: 5}}>

                    </div>
                </div>
            </div>
        );
    }
}

export default BindToChainState(Blocks, {keep_updating: true, show_loader: true});
