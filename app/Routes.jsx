import React from "react";

import { Route, IndexRoute,IndexRedirect, Redirect } from "react-router/es";
import willTransitionTo from "./routerTransition";
import App from "./App";
import AccountStore from "./stores/AccountStore";

/*
* Electron does not support async loading of components via System.import,
* so we make sure they're bundled already by including them here
*/
if (__ELECTRON__ || __HASH_HISTORY__) {
    require("./electron_imports");
}

class Auth extends React.Component {
    render() {return null; }
}

function loadRoute(cb, moduleName = "default") {
    return (module) => cb(null, module[moduleName]);
}

function errorLoading(err) {
    console.error("Dynamic page loading failed", err);
}

const onAccountManagerEnter = function(nextState, replaceState, callback){
  let account =  AccountStore.getState().currentAccount || AccountStore.getState().passwordAccount;

  if(!account && !nextState.params.account_name){
    replaceState("/create-account/wallet");
  }
  callback();
};

const routes = (
    <Route path="/" component={App} onEnter={willTransitionTo}>
        <IndexRoute getComponent={(location, cb) => {
            System.import("components/Explorer/HousesIndex").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/auth/:data" component={Auth}/>
        <Route path="/dashboard" getComponent={(location, cb) => {
            System.import("components/Dashboard/DashboardContainer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="explorer" getComponent={(location, cb) => {
            System.import("components/Explorer/Explorer").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <IndexRoute getComponent={(location, cb) => {
                System.import("components/Explorer/BlocksContainer").then(loadRoute(cb)).catch(errorLoading);
            }}/>

            <Route path="/explorer/fees" getComponent={(location, cb) => {
                System.import("components/Explorer/FeesContainer").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/explorer/blocks" getComponent={(location, cb) => {
                System.import("components/Explorer/BlocksContainer").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/explorer/assets" getComponent={(location, cb) => {
                System.import("components/Explorer/AssetsContainer").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/explorer/accounts" getComponent={(location, cb) => {
                System.import("components/Explorer/AccountsContainer").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/explorer/witnesses" getComponent={(location, cb) => {
                System.import("components/Explorer/Witnesses").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/explorer/committee-members" getComponent={(location, cb) => {
                System.import("components/Explorer/CommitteeMembers").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/explorer/oracles" getComponent={(location, cb) => {
                System.import("components/Explorer/Oracles").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="asset/:symbol" getComponent={(location, cb) => {
                System.import("components/Blockchain/Asset").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="markets" getComponent={(location, cb) => {
                System.import("components/Explorer/MarketsContainer").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="tx/:tx_id" getComponent={(location, cb) => {
                System.import("components/Explorer/Transaction").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="block/:height" getComponent={(location, cb) => {
              System.import("components/Blockchain/BlockContainer").then(loadRoute(cb)).catch(errorLoading);
            }}/>
        </Route>


        <Route path="/prediction" getComponent={(location, cb) => {
            System.import("components/Explorer/HousesIndex").then(loadRoute(cb)).catch(errorLoading);
        }}>
          <Route path="rooms/:room_id" getComponent={(location, cb) => {
            System.import("components/Account/RoomParticipate").then(loadRoute(cb)).catch(errorLoading);
          }}/>
        </Route>
        <Route path="/prediction/:house_id" getComponent={(location, cb) => {
            System.import("components/Explorer/HouseDetail").then(loadRoute(cb)).catch(errorLoading);
        }}/>

        <Route path="wallet" getComponent={(location, cb) => {
            System.import("components/Wallet/WalletManager").then(loadRoute(cb, "WalletManager")).catch(errorLoading);
        }}>
            {/* wallet management console */}
            <IndexRoute getComponent={(location, cb) => {
                System.import("components/Wallet/WalletManager").then(loadRoute(cb, "WalletOptions")).catch(errorLoading);
            }}/>
            <Route path="change" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletManager").then(loadRoute(cb, "ChangeActiveWallet")).catch(errorLoading);
            }}/>
            <Route path="change-password" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletChangePassword").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="import-keys" getComponent={(location, cb) => {
                System.import("components/Wallet/ImportKeys").then(loadRoute(cb, "ExistingAccountOptions")).catch(errorLoading);
            }}/>
            <Route path="brainkey" getComponent={(location, cb) => {
                System.import("components/Wallet/Brainkey").then(loadRoute(cb, "ExistingAccountOptions")).catch(errorLoading);
            }}/>
            <Route path="create" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletCreate").then(loadRoute(cb, "WalletCreate")).catch(errorLoading);
            }}/>
            <Route path="delete" getComponent={(location, cb) => {
                System.import("components/Wallet/WalletManager").then(loadRoute(cb, "WalletDelete")).catch(errorLoading);
            }}/>
            <Route path="backup/restore" getComponent={(location, cb) => {
                System.import("components/Wallet/Backup").then(loadRoute(cb, "BackupRestore")).catch(errorLoading);
            }}/>
            <Route path="backup/create" getComponent={(location, cb) => {
                System.import("components/Wallet/Backup").then(loadRoute(cb, "BackupCreate")).catch(errorLoading);
            }}/>
            <Route path="backup/brainkey" getComponent={(location, cb) => {
                System.import("components/Wallet/BackupBrainkey").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="balance-claims" getComponent={(location, cb) => {
                System.import("components/Wallet/BalanceClaimActive").then(loadRoute(cb)).catch(errorLoading);
            }}/>
        </Route>

        <Route path="create-wallet" getComponent={(location, cb) => {
            System.import("components/Wallet/WalletCreate").then(loadRoute(cb, "WalletCreate")).catch(errorLoading);
        }}/>

        <Route path="create-wallet-brainkey" getComponent={(location, cb) => {
            System.import("components/Wallet/WalletCreate").then(loadRoute(cb, "CreateWalletFromBrainkey")).catch(errorLoading);
        }}/>

        <Route path="transfer" getComponent={(location, cb) => {
            System.import("components/Transfer/Transfer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="invoice/:data" getComponent={(location, cb) => {
            System.import("components/Transfer/Invoice").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="market/:marketID" getComponent={(location, cb) => {
            System.import("components/Exchange/ExchangeContainer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="settings" getComponent={(location, cb) => {
            System.import("components/Settings/SettingsContainer").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <IndexRedirect to="general"/>
        </Route>
        <Route path="settings/:tab" getComponent={(location, cb) => {
            System.import("components/Settings/SettingsContainer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Redirect from="block/:height" to="/explorer/block/:height" />

        <Route path="create-account" getComponent={(location, cb) => {
            System.import("components/LoginSelector").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <Route path="wallet" getComponent={(location, cb) => {
                System.import("components/Account/CreateAccount").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="password" getComponent={(location, cb) => {
                System.import("components/Account/CreateAccountPassword").then(loadRoute(cb)).catch(errorLoading);
            }}/>
        </Route>

        <Route path="accounts" getComponent={(location, cb) => {
            System.import("components/Dashboard/DashboardAccountsOnly").then(loadRoute(cb)).catch(errorLoading);
        }}/>

        <Route path="existing-account" getComponent={(location, cb) => {
            System.import("components/Wallet/ExistingAccount").then(loadRoute(cb, "ExistingAccount")).catch(errorLoading);
        }}>
            <IndexRoute getComponent={(location, cb) => {
                System.import("components/Wallet/Backup").then(loadRoute(cb, "BackupRestore")).catch(errorLoading);
            }}/>
            <Route path="import-backup" getComponent={(location, cb) => {
                System.import("components/Wallet/ExistingAccount").then(loadRoute(cb, "ExistingAccountOptions")).catch(errorLoading);
            }}/>
            <Route path="import-keys" getComponent={(location, cb) => {
                System.import("components/Wallet/ImportKeys").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="brainkey" getComponent={(location, cb) => {
                System.import("components/Wallet/Brainkey").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="balance-claim" getComponent={(location, cb) => {
                System.import("components/Wallet/BalanceClaimActive").then(loadRoute(cb)).catch(errorLoading);
            }}/>
        </Route>

        <Route path="/account" onEnter={onAccountManagerEnter}>
          <Route path=":account_name" getComponent={(location, cb) => {
              System.import("components/Account/Account").then(loadRoute(cb)).catch(errorLoading);
          }}>
              <IndexRoute getComponent={(location, cb) => {
                  System.import("components/Account/AccountDashboard").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              {/* <Route path="dashboard" getComponent={(location, cb) => {
                  System.import("components/Account/AccountOverview").then(loadRoute(cb)).catch(errorLoading);
              }}/> */}
              {/* <Route path="deposit-withdraw" getComponent={(location, cb) => {
                  System.import("components/Account/AccountDepositWithdraw").then(loadRoute(cb)).catch(errorLoading);
              }}/> */}
              {/* <Route path="orders" getComponent={(location, cb) => {
                  System.import("components/Account/AccountOrders").then(loadRoute(cb)).catch(errorLoading);
              }}/> */}
              <Route path="accounts" getComponent={(location, cb) => {
                System.import("components/Dashboard/DashboardAccountsOnly").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="history" getComponent={(location, cb) => {
                System.import("components/Dashboard/DashboardAccountsOnly").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="contacts" getComponent={(location, cb) => {
                System.import("components/Dashboard/DashboardAccountsOnly").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="prediction" getComponent={(location, cb) => {
                System.import("components/Account/AccountPrediction").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="assets" getComponent={(location, cb) => {
                  System.import("components/Account/AccountAssets").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="create-asset" getComponent={(location, cb) => {
                  System.import("components/Account/AccountAssetCreate").then(loadRoute(cb, "AccountAssetCreate")).catch(errorLoading);
              }}/>
              <Route path="update-asset/:asset" getComponent={(location, cb) => {
                  System.import("components/Account/AccountAssetUpdate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="member-stats" getComponent={(location, cb) => {
                  System.import("components/Account/AccountMembership").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="vesting" getComponent={(location, cb) => {
                  System.import("components/Account/AccountVesting").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="permissions" getComponent={(location, cb) => {
                  System.import("components/Account/AccountPermissions").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="voting" getComponent={(location, cb) => {
                  System.import("components/Account/AccountVoting").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="whitelist" getComponent={(location, cb) => {
                  System.import("components/Account/AccountWhitelist").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="signedmessages" getComponent={(location, cb) => {
                  System.import("components/Account/AccountSignedMessages").then(loadRoute(cb)).catch(errorLoading);
              }}/>

              <Route path="create-oracle" getComponent={(location, cb) => {
                  System.import("components/Account/AccountOracleCreate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="oracle" getComponent={(location, cb) => {
                  System.import("components/Account/AccountOracle").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="create-house" getComponent={(location, cb) => {
                  System.import("components/Account/AccountHouseCreate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="houses" getComponent={(location, cb) => {
                  System.import("components/Account/AccountHouse").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="guaranty" getComponent={(location, cb) => {
                System.import("components/Account/AccountGuaranty").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="create-room/single=:ok" getComponent={(location, cb) => {
                  System.import("components/Account/AccountRoomCreate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="create-room" getComponent={(location, cb) => {
                  System.import("components/Account/AccountRoomCreate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="rooms/:room_id" getComponent={(location, cb) => {
                  System.import("components/Account/RoomParticipate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="update-room/:room_id" getComponent={(location, cb) => {
                  System.import("components/Account/AccountRoomUpdateWrapper").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="update-house/:house_id" getComponent={(location, cb) => {
                  System.import("components/Account/AccountHouseUpdate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="update-oracle/:oracle_id" getComponent={(location, cb) => {
                  System.import("components/Account/AccountOracleUpdate").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="witness" getComponent={(location, cb) => {
                  System.import("components/Account/AccountWitness").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="dashboard" getComponent={(location, cb) => {
                  System.import("components/Account/AccountDashboard").then(loadRoute(cb)).catch(errorLoading);
              }}/>
              <Route path="erc20-gateway" getComponent={(location, cb) => {
                System.import("components/Balances/ERC20Gateway").then(loadRoute(cb)).catch(errorLoading);
              }}/>

              <Redirect from="overview" to="/account/:account_name" />
              <Redirect from="orders" to="/account/:account_name" />
          </Route>
        </Route>
        <Route path="deposit-withdraw" getComponent={(location, cb) => {
            System.import("components/Account/AccountDepositWithdraw").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="create-worker" getComponent={(location, cb) => {
            System.import("components/Account/CreateWorker").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/init-error" getComponent={(location, cb) => {
            System.import("components/InitError").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/news" getComponent={(location, cb) => {
            System.import("components/News").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/help" getComponent={(location, cb) => {
            System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <Route path=":path1" getComponent={(location, cb) => {
                System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
            }}>
                <Route path=":path2" getComponent={(location, cb) => {
                    System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
                }}>
                    <Route path=":path3" getComponent={(location, cb) => {
                        System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
                    }} />
                </Route>
            </Route>
        </Route>
    </Route>
);

export default routes;
