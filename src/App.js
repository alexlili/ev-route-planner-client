import React, { useState, useEffect } from "react";

import {
  MenuOutlined,
  HeartOutlined,
  createFromIconfontCN,
} from "@ant-design/icons";
import chargerIcon from "./assets/charging-station.png";
import { Flex, ConfigProvider, Layout, theme, Modal, Image } from "antd";

import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { useNavigate } from "react-router-dom";
import { Outlet, useLocation } from "react-router-dom";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Authenticator } from "@aws-amplify/ui-react";

const { Header, Content, Footer } = Layout;
const IconFont = createFromIconfontCN({
  scriptUrl: "//at.alicdn.com/t/font_8d5l8fzk5b87iudi.js",
});
const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  // 定义selectedKeys，来控制菜单选中状态和切换页面
  const [selectedKeys, setSelectedKeys] = useState([]);
  // useLocation react-router自带hook，能获取到当前路由信息
  const location = useLocation();
  // 每次切换路由，获取当前最新的pathname,并赋给menu组件
  useEffect(() => {
    // location.pathname对应路由数据中的path属性
    setSelectedKeys([location.pathname]);
  }, [location]);
  const onSearch = () => {};
  async function handleSignOut() {
    try {
      await signOut();
      await currentAuthenticatedUser();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }
  async function currentAuthenticatedUser() {
    try {
      const { username, userId, signInDetails } = await getCurrentUser();
      setUsername(username);
    } catch (err) {
      setUsername(null);
      console.log(err);
    }
  }
  useEffect(() => {
    currentAuthenticatedUser();
  }, []);
  const showLoginModal = () => {
    setIsModalOpen(true);
  };
  const handleCancelLogin = () => {
    setIsModalOpen(false);
  };
  return (
    <ConfigProvider
      theme={{
        token: {
          colorText: "#000",
          // Seed Token
          colorPrimary: "rgb(4 125 149)",
          borderRadius: 4,

          // Alias Token
          colorBgContainer: "rgb(4 125 149)",
        },
        components: {
          Button: {
            colorText: "#fff",
            fontWeight: "bold",
            defaultBg: "rgb(4 125 149)",
            defaultBorderColor: "rgb(4 125 149)",
            defaultHoverBg: "rgba(245,197,24,0.9)",
            defaultHoverBorderColor: "rgba(245,197,24,0.9)",
            defaultHoverColor: "rgb(0,0,0)",
            defaultActiveBorderColor: "rgb(4 125 149)",
            defaultActiveColor: "rgb(4 125 149)",
          },
          Input: {
            colorPrimary: "rgb(4 125 149)",
            algorithm: true, // Enable algorithm
          },
        },
      }}
    >
      <Layout style={{ position: "relative", height: "100%", width: "100%" }}>
        <div
          style={{
            background: colorBgContainer,
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontWeight: "bold",
            position: "fixed",
            right: 20,
            top: 20,
            zIndex: 100,
            borderRadius:10,
            padding:'14px 15px'
          }}
        >
          <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <Image height={30} src={chargerIcon} style={{paddingRight:10}}/>
            {username ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {username}
                </div>
                <div
                  style={{ padding: "0 20px", cursor: "pointer" }}
                  onClick={handleSignOut}
                >
                  Sign Out
                </div>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <div
                  style={{}}
                  onClick={() => {
                    navigate("/home");
                  }}
                >
                  EV Route Planner
                </div>
                <div
                  style={{ paddingLeft: 20, cursor: "pointer",color:'#33cc11' }}
                  onClick={showLoginModal}
                >
                  Sign In
                </div>
              </div>
            )}
          </div>
        </div>
        <Content
          style={{
            width: "100%",
            height: "100vh",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <Modal
        title=""
        open={isModalOpen}
        footer={null}
        onCancel={handleCancelLogin}
      >
        <div style={{ paddingTop: 30 }}>
          <Authenticator>
            {({ user }) => {
              handleCancelLogin();
              setUsername(user.username);
            }}
          </Authenticator>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default App;
