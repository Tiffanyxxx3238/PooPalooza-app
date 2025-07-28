from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ======= 這裡填入你的 PostgreSQL 連線字串 =======
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://u4j1jv2dr1fh01:p07678848e289580d311d742952d9d8ed82b674311c5428fb7bb240e1d759c755@c34u0gd6rbe7bo.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d220cs38ofjr2n'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ======= 範例資料表（Checkin）=======
class Checkin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(50))
    location = db.Column(db.String(100))
    emoji = db.Column(db.String(10))
    note = db.Column(db.String(200))

# ======= 第一次啟動自動建立資料表 =======
with app.app_context():
    db.create_all()


@app.route('/')
def hello():
    return "Hello, PooPalooza!"

# ======= 打卡 POST API =======
@app.route('/checkin', methods=['POST'])
def add_checkin():
    data = request.json
    checkin = Checkin(
        user=data.get('user'),
        location=data.get('location'),
        emoji=data.get('emoji'),
        note=data.get('note')
    )
    db.session.add(checkin)
    db.session.commit()
    return jsonify({"success": True, "msg": "打卡成功"})

# ======= 查詢所有打卡 GET API =======
@app.route('/checkin', methods=['GET'])
def list_checkins():
    checkins = Checkin.query.all()
    result = [
        {
            "id": c.id,
            "user": c.user,
            "location": c.location,
            "emoji": c.emoji,
            "note": c.note
        }
        for c in checkins
    ]
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
