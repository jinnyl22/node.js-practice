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
const mailer = require("./router/mailer");
const randomNum = require("./router/random");
// console.log(mailer);
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

// 회원가입에서 중복검사 버튼을 누른 후
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
  // let email = req.body;
  // 구조분해할당으로 사용할 때는 꼭!!!! 객체로 가져와야한다!!! 꼭!!!!!!
  // let { email } = req.body;
  let email = req.body.email;
  req.session.email = email;
  console.log(email);
  // result는 *전체 객체로 나오기 때문에 꼭!! 키에 접근을 해주어야한다.
  sql.query("select * from members where email = ?", email, (err, result) => {
    if (result[0] != undefined) {
      res.send("fail");
    } else if (result[0] == undefined) {
      let ranNum = randomNum.randomfunc();
      req.session.randomNum = ranNum;
      req.session.emailToken = jwt.sign({}, process.env.ET_SECRET_KEY, {
        expiresIn: "3m",
      });
      let sendmail = {
        // toEmail: email.email,
        toEmail: email,
        subject: `안녕하세요 내코석 이메일 인증번호 입니다.`,
        text: `${email}님 반갑습니다. 이메일 인증번호는 <h1>${ranNum}</h1> 입니다. 인증번호 칸에 입력 후 인증 확인 부탁드립니다.`,
      };
      mailer.sendmail(sendmail);
      res.send("suc");
    }
  });
});

// 인증번호 체크
app.post("/numCheck", (req, res) => {
  let num = req.body.num;
  // console.log(emailtoken);
  // try {
  //   num == req.session.randomNum &&
  //     jwt.verify(req.session.emailToken, process.env.ET_SECRET_KEY);
  //   res.send("suc");
  // } catch (error) {
  //   res.send("fail");
  // }
  // 이메일 3분 토큰이 썩었는지 싱싱한지 확인하는 곳
  jwt.verify(
    req.session.emailToken,
    process.env.ET_SECRET_KEY,
    (err, result) => {
      if (err) res.send("timeover");
      else if (req.session.randomNum == num) res.send("suc");
      else if (req.session.randomNum !== num) res.send("fail");
    }
  );
  // if (num == req.session.randomNum) {
  //   res.send("suc");
  // } else if (num !== req.session.randomNum) {
  //   res.send("fail");
  // }
});

// 회원가입 버튼을 누른 후
app.post("/signup", (req, res) => {
  console.log(req.session);
  // 객체에 유저의 입력 값을 담아준다.
  let { id, pw, email } = req.body;
  console.log(id, pw, email);
  // 여기서 유저의 비밀번호를 암호화시켜준다.
  bcrypt.hash(pw, 10, (err, result) => {
    // 중복체크 후에 아이디를 수정해서 다른 것으로 입력하려고 했을 때 다시 중복검사를 할 수 있도록!
    // 세션에 저장된 유저의 아이디와 이메일이 유저가 인풋에 입력한 값과 같으면 회원가입을 시켜준다
    if (req.session.user_id == id && req.session.email == email) {
      // 쿼리문 실행
      sql.query(
        "insert into members (id,pw,email) values (?,?,?)",
        [id, result, email],
        (err, result) => {
          // 쿼리문 에러
          if (err) console.log("query err", err);
          else res.send("suc");
        }
      );
      // 같지 않을 경우에는 다시 중복검사부터 시켜줘야함!
    } else res.send("retry");
  });
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
      bcrypt.compare(pw, result[0].pw, (err, result) => {
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
              if (result[0]?.refreshtoken == rt) {
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

// 비밀번호 찾기!
app.post("/findPw", (req, res) => {
  let email = req.body.email;
  let ranNum = randomNum.randomfunc();
  req.session.randomNum = ranNum;
  req.session.emailToken = jwt.sign({}, process.env.ET_SECRET_KEY, {
    expiresIn: "3m",
  });
  let sendmail = {
    // toEmail: email.email,
    toEmail: email,
    subject: `안녕하세요 내코석 이메일 인증번호 입니다.`,
    text: `${email}님 반갑습니다. 이메일 인증번호는 <h1>${ranNum}</h1> 입니다. 인증번호 칸에 입력 후 인증 확인 부탁드립니다.`,
  };
  mailer.sendmail(sendmail);
  // 토큰이 유효한지 유효하지 않은지 검사
  jwt.verify(
    req.session.emailToken,
    process.env.ET_SECRET_KEY,
    (err, result) => {
      if(err) res.send("fail")
      else{
        if(req.session.randomNum == num) 
      }
    }
  );

  sql.query("SELECT * FROM members WHERE email=?", email, (err, result) => {});
});

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
