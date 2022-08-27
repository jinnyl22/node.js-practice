// express, jsonwebtoken, express-session, dotenv, mysql2, bcrypt
//
const express = require("express"); //
const jwt = require("jsonwebtoken");
const session = require("express-session");
const dot = require("dotenv").config();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const ejs = require("ejs");

const app = express();

// jwt 토큰 사용법
// jwt.sign()첫번째 파라미터엔 객체가 들어가고 해당 객체엔 자유롭게 키값 설정 후 밸류 값엔 민감하지 않은 정보를 담으면 돼요 ex) id
// 두번째 파라미터 암호화키 세번째 토큰의 옵션
// jwt.verify() 첫번째 파라미터엔 복호화? 할 토큰 , 두번째엔 해당 토큰을 만들었을 때 쓴 암호화 키
// 세번째엔 콜백을줘도 돼 이런식으로(err,decoded)

// express session을 사용하기 위한 미들웨어
app.use(
  session({
    key: "rudghks09",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// req.body를 사용하려면 써줘야한다.
app.use(express.urlencoded({ extended: false }));

app.set("views", "./view");
app.set("view engine", "ejs");

// sql에 접속
const sql = mysql.createConnection({
  user: "root",
  password: "03070307",
  database: "test15",
  host: "localhost", // 127.0.0.1
});

//
app.get("/", (req, res) => {
  // console.log(req.session)
  res.render("index");
});

// 중복검사 버튼을 누른 후
app.post("/check", (req, res) => {
  // 유저가 인풋창에 입력한 id값 -> req.body.id
  // id에 담아준다
  let id = req.body.id;
  // console.log(req.session.user_id);
  // 테이블에서 내가 찾고자 하는 값이 있나 조건을 걸어준다
  sql.query("SELECT * FROM members where id = ?", [id], (err, result) => {
    // 중복된 아이디가 있을 경우!
    // 결과 값은 배열로 들어온다
    if (result[0] !== undefined) {
      res.send("fail");
    }
    // 중복된 아이디가 없을 경우!
    else {
      // 세션에 유저의 입력값을 담아준다.
      // 세션은 우리가 임의의 공간을 만들어서 값을 저장 시켜줄 수 있다.
      req.session.user_id = req.body.id;
      res.send("use");
    }
  });
});

// 이메일 인증하는 곳
// const 이메일인증 = 이메일인증번호;
app.post("/emailCheck", (req, res) => {
  let email = req.body;
  // result는 *전체 객체로 나오기 때문에 꼭!! 키에 접근을 해주어야한다.
  sql.query("select * from members where email=?", email, (err, result) => {
    if (result[0].email == email) {
      res.send("fail");
    } else if (result[0].email !== email) {
      res.send("suc");
    }
  });
});

// 회원가입 버튼을 누른 후
app.post("/signup", (req, res) => {
  // 객체에 유저의 입력 값을 담아준다.
  let { id, pw } = req.body;
  console.log(id, pw);
  // 여기서 유저의 비밀번호를 암호화시켜준다.
  bcrypt.hash(pw, 10, (err, result) => {
    // 세션에 저장된 유저의 아이디와 유저가 인풋에 입력한 값이 같으면
    if (req.session.user_id == id) {
      // 쿼리문 실행
      sql.query(
        "insert into members (id,pw) values (?,?)",
        [id, result],
        (err, result) => {
          // 쿼리문 에러
          if (err) console.log("query err", err);
          else res.send("suc");
        }
      );
      // 같지 않을 경우
    } else res.send("retry");
  });
  // 세션에 저장한 id와 유저의 id 값이 같을 경우
});

// get방식으로 로그인창을 열어준다.
app.get("/login", (req, res) => {
  res.render("login");
});

// Post방식으로 로그인창을 열어준다
app.post("/login", (req, res) => {
  let { id, pw } = req.body;
  // sql에 접근해 쿼리문을 작성해준다.
  // members라는 테이블에 접근해 pw를 보여주고 조건으로 아이디의 값이 어떤것이면
  sql.query("select pw from members where id = ?", id, (err, result) => {
    console.log(result);
    // 아이디가 없는 경우
    if (result[0] == undefined) res.send("fail");
    // 암호화된 비밀번호를 비교해주는데
    // 첫번째 파라미터는 유저가 인풋창에 입력한 비밀번호 값
    // 두번째 파라미터는 DB에 저장된 비밀번호 값
    else
      bcrypt.compare(pw, result[0]?.pw, (err, result) => {
        // 비교 후 일치하는 결과 값이 있다면
        if (result) {
          // access 토큰 발급
          // 세션에 at라는 공간에
          // access 토큰을 생성해서 저장해준다.
          req.session.at = jwt.sign(
            {
              user_id: id,
            },
            // env를 접근할때는 process를 적어준다!
            process.env.AT_SECRET_KEY,
            {
              expiresIn: "10s",
              issuer: "jinny",
            }
          );
          // 리프레쉬 토큰 발급
          const RT = jwt.sign(
            {
              user_id: id,
            },
            process.env.RT_SECRET_KEY,
            {
              expiresIn: "1m",
              issuer: "jinny",
            }
          );
          // refresh 토큰은 로그인할 때 access토큰을 발급해주기 위해서와
          // 유효한 토큰인지 아닌지 검사를 할때도 필요하기 때문에
          // 세션과 DB 둘 다 저장한다.
          req.session.rt = RT;
          sql.query(
            "UPDATE members SET refreshtoken = ? WHERE id = ?",
            [RT, id],
            (err) => {
              if (err) console.log(err);
            }
          );
          res.send("suc");
        } // 성공 했으면 토큰 발급 까지함!
        else if (!result) res.send("fail");
      });
  });
});

// 404 처리
// * 모든 페이지

app.listen(80, () => {
  console.log("80 server on!!!");
});

// http : 80 default port number
const 로그인검증 = (req, res, next) => {
  const { at, rt } = req.session;
  jwt.verify(at, process.env.AT_SECRET_KEY, (err, decoded) => {
    // at가 있고, 만료되지 않았을 때
    if (decoded) next();
    // at가 없거나, 만료가 되었을 경우
    // 그러면 rt를 확인을 해줘야함
    else if (err) {
      jwt.verify(rt, process.env.RT_SECRET_KEY, (err, decoded) => {
        // rt가 살아있는 전제 조건 하에
        if (decoded) {
          // db에 있는 rt이랑 session에 있는 rt랑 비교해주어야한다
          sql.query(
            "SELECT * FROM members WHERE refreshtoken =?",
            rt,
            (err, result) => {
              if (result[0].refreshtoken == rt) {
                req.session.at = jwt.sign(
                  {
                    user_id: decoded.user_id,
                  },
                  process.env.AT_SECRET_KEY,
                  {
                    expiresIn: "10s",
                    issuer: "jinny",
                  }
                );
                next();
                // 재로그인
              } else res.send("tokenfail");
            }
          );
          // 재로그인
        } else if (err) res.send("tokenfail");
      });
    }
  });
  // 첫번째 파라미터 == 검증할 토큰 / 두번째 파라미터 == 해당 토큰 암호화했던 시크릿 키 / 세번째는 콜백 함수
};

app.get("/mypage", 로그인검증, (req, res) => {
  res.send("환영합니다.");
});

app.get("*", (req, res) => {
  res.status(404).render("404");
});
// 토큰이 있나 없나 검사
// at가 있고 rt가 만료가 되지 않은 경우 - 마이페이지ㅣ로 보내줌
// at가 없을 경우 rt도 없는 경우 - 로그인을 해야함
// at가 유효하지 않고 rt는 유효한 경우 - 새로 at 재발급 후 마이페이지
// at랑 rt 둘다 유효하지 않은 경우 - 재로그인 요청
