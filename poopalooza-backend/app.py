from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ======= 這裡填入你的 PostgreSQL 連線字串 =======
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://u4j1jv2dr1fh01:p07678848e289580d311d742952d9d8ed82b674311c5428fb7bb240e1d759c755@c34u0gd6rbe7bo.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d220cs38ofjr2n'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
# ======= 廁所資料表模型 =======
class PublicToilet(db.Model):
    __tablename__ = 'public_toilets'
    
    id = db.Column(db.Integer, primary_key=True)
    toilet_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(200))
    address = db.Column(db.String(500))
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    village = db.Column(db.String(100))
    administration = db.Column(db.String(200))
    grade = db.Column(db.String(50))
    type2 = db.Column(db.String(100))
    toilet_type = db.Column(db.String(100))
    exec = db.Column(db.String(100))
    diaper = db.Column(db.Boolean)

# ======= 範例資料表（Checkin）=======
class Checkin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(50))
    location = db.Column(db.String(100))
    emoji = db.Column(db.String(10))
    note = db.Column(db.String(200))
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

# ======= 資料庫設定 =======
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://u4j1jv2dr1fh01:p07678848e289580d311d742952d9d8ed82b674311c5428fb7bb240e1d759c755@c34u0gd6rbe7bo.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d220cs38ofjr2n'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ======= 廁所資料表模型 =======
class PublicToilet(db.Model):
    __tablename__ = 'public_toilets'
    
    id = db.Column(db.Integer, primary_key=True)
    toilet_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(200))
    address = db.Column(db.String(500))
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    village = db.Column(db.String(100))
    administration = db.Column(db.String(200))
    grade = db.Column(db.String(50))
    type2 = db.Column(db.String(100))
    toilet_type = db.Column(db.String(100))
    exec = db.Column(db.String(100))
    diaper = db.Column(db.Boolean)

# ======= 打卡資料表模型（保留原有的）=======
class Checkin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(50))
    location = db.Column(db.String(100))
    emoji = db.Column(db.String(10))
    note = db.Column(db.String(200))

# ======= 工具函數：計算兩點間距離 =======
def calculate_distance(lat1, lon1, lat2, lon2):
    """
    計算兩個經緯度座標之間的距離（公里）
    使用 Haversine 公式
    """
    R = 6371  # 地球半徑（公里）
    
    lat1_rad = math.radians(float(lat1))
    lon1_rad = math.radians(float(lon1))
    lat2_rad = math.radians(float(lat2))
    lon2_rad = math.radians(float(lon2))
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# ======= 工具函數：判斷政府機關 =======
def is_government_facility(name, address, toilet_type, type2):
    """判斷是否為政府機關"""
    gov_keywords = [
        '公所', '市政府', '縣政府', '區公所', '鄉公所', '鎮公所', '里民活動中心',
        '公園', '學校', '圖書館', '醫院', '衛生所', '國小', '國中', '高中', '大學',
        '火車站', '捷運站', '政府', '市府', '縣府', '戶政', '地政', '警察局', '消防局'
    ]
    
    all_text = f"{name or ''} {address or ''} {toilet_type or ''} {type2 or ''}"
    return any(keyword in all_text for keyword in gov_keywords)

# ======= 第一次啟動自動建立資料表 =======
with app.app_context():
    db.create_all()

# ======= 基本路由 =======
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

# ======= 🚻 廁所相關 API =======

@app.route('/api/bathrooms/nearby', methods=['POST'])
def get_nearby_bathrooms():
    """獲取附近的廁所"""
    try:
        data = request.json
        user_lat = float(data.get('latitude'))
        user_lng = float(data.get('longitude'))
        radius = float(data.get('radius', 1000))  # 預設 1000 公尺
        limit = int(data.get('limit', 50))  # 預設最多 50 個
        
        print(f"🔍 查詢附近廁所: 緯度 {user_lat}, 經度 {user_lng}, 半徑 {radius}m")
        
        # 先粗略篩選在方形範圍內的廁所（提高查詢效率）
        lat_range = radius / 111000  # 1 度緯度約 111km
        lng_range = radius / (111000 * math.cos(math.radians(user_lat)))
        
        toilets = PublicToilet.query.filter(
            PublicToilet.latitude.between(user_lat - lat_range, user_lat + lat_range),
            PublicToilet.longitude.between(user_lng - lng_range, user_lng + lng_range),
            PublicToilet.latitude.isnot(None),
            PublicToilet.longitude.isnot(None)
        ).all()
        
        print(f"📊 粗略篩選後找到 {len(toilets)} 個廁所")
        
        # 計算精確距離並篩選
        nearby_toilets = []
        for toilet in toilets:
            distance_km = calculate_distance(user_lat, user_lng, toilet.latitude, toilet.longitude)
            distance_m = distance_km * 1000
            
            if distance_m <= radius:
                # 判斷來源類型
                if is_government_facility(toilet.name, toilet.address, toilet.toilet_type, toilet.type2):
                    source = 'gov'
                else:
                    source = 'commercial'
                
                nearby_toilets.append({
                    'toilet_id': toilet.toilet_id,
                    'name': toilet.name or '公共廁所',
                    'address': toilet.address or '',
                    'latitude': float(toilet.latitude),
                    'longitude': float(toilet.longitude),
                    'distance': round(distance_m, 1),
                    'toilet_type': toilet.toilet_type,
                    'type2': toilet.type2,
                    'city': toilet.city,
                    'administration': toilet.administration,
                    'source': source
                })
        
        # 按距離排序
        nearby_toilets.sort(key=lambda x: x['distance'])
        
        # 限制數量
        result = nearby_toilets[:limit]
        
        print(f"✅ 最終返回 {len(result)} 個附近廁所")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ 查詢附近廁所錯誤: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bathrooms/region', methods=['POST'])
def get_bathrooms_by_region():
    """獲取地圖區域內的廁所"""
    try:
        data = request.json
        north_east = data.get('northEast')
        south_west = data.get('southWest')
        page = int(data.get('page', 1))
        limit = int(data.get('limit', 100))
        
        offset = (page - 1) * limit
        
        print(f"🗺️ 查詢地圖區域廁所: NE({north_east['lat']}, {north_east['lng']}) SW({south_west['lat']}, {south_west['lng']})")
        
        # 查詢範圍內的廁所
        toilets_query = PublicToilet.query.filter(
            PublicToilet.latitude.between(south_west['lat'], north_east['lat']),
            PublicToilet.longitude.between(south_west['lng'], north_east['lng']),
            PublicToilet.latitude.isnot(None),
            PublicToilet.longitude.isnot(None)
        )
        
        # 計算總數
        total_count = toilets_query.count()
        
        # 分頁查詢
        toilets = toilets_query.offset(offset).limit(limit).all()
        
        result_bathrooms = []
        for toilet in toilets:
            # 判斷來源類型
            if is_government_facility(toilet.name, toilet.address, toilet.toilet_type, toilet.type2):
                source = 'gov'
            else:
                source = 'commercial'
            
            result_bathrooms.append({
                'toilet_id': toilet.toilet_id,
                'name': toilet.name or '公共廁所',
                'address': toilet.address or '',
                'latitude': float(toilet.latitude),
                'longitude': float(toilet.longitude),
                'toilet_type': toilet.toilet_type,
                'type2': toilet.type2,
                'city': toilet.city,
                'administration': toilet.administration,
                'source': source
            })
        
        result = {
            'bathrooms': result_bathrooms,
            'totalCount': total_count,
            'hasMore': total_count > offset + limit,
            'currentPage': page
        }
        
        print(f"✅ 返回 {len(result_bathrooms)} 個地圖廁所，總計 {total_count} 個")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ 查詢地圖區域廁所錯誤: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bathrooms/search', methods=['POST'])
def search_bathrooms():
    """搜尋廁所"""
    try:
        data = request.json
        query = data.get('query', '').strip()
        location = data.get('location')  # 可選的使用者位置
        limit = int(data.get('limit', 20))
        
        print(f"🔍 搜尋廁所關鍵字: '{query}'")
        
        if not query:
            return jsonify([])
        
        # 模糊搜尋名稱和地址
        search_term = f"%{query}%"
        toilets = PublicToilet.query.filter(
            db.or_(
                PublicToilet.name.ilike(search_term),
                PublicToilet.address.ilike(search_term),
                PublicToilet.city.ilike(search_term),
                PublicToilet.administration.ilike(search_term)
            ),
            PublicToilet.latitude.isnot(None),
            PublicToilet.longitude.isnot(None)
        ).limit(limit).all()
        
        result_bathrooms = []
        for toilet in toilets:
            # 如果有使用者位置，計算距離
            distance = None
            if location:
                try:
                    distance_km = calculate_distance(
                        location['latitude'], location['longitude'],
                        toilet.latitude, toilet.longitude
                    )
                    distance = round(distance_km * 1000, 1)  # 轉換為公尺
                except:
                    pass
            
            # 判斷來源類型
            if is_government_facility(toilet.name, toilet.address, toilet.toilet_type, toilet.type2):
                source = 'gov'
            else:
                source = 'commercial'
            
            result_bathrooms.append({
                'toilet_id': toilet.toilet_id,
                'name': toilet.name or '公共廁所',
                'address': toilet.address or '',
                'latitude': float(toilet.latitude),
                'longitude': float(toilet.longitude),
                'distance': distance,
                'toilet_type': toilet.toilet_type,
                'type2': toilet.type2,
                'city': toilet.city,
                'administration': toilet.administration,
                'source': source
            })
        
        # 如果有距離資訊，按距離排序
        if location:
            result_bathrooms.sort(key=lambda x: x['distance'] or float('inf'))
        
        print(f"✅ 搜尋到 {len(result_bathrooms)} 個廁所")
        
        return jsonify(result_bathrooms)
        
    except Exception as e:
        print(f"❌ 搜尋廁所錯誤: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bathrooms/stats', methods=['GET'])
def get_bathroom_stats():
    """獲取廁所統計資訊"""
    try:
        total_count = PublicToilet.query.count()
        
        # 按城市統計
        city_stats = db.session.query(
            PublicToilet.city,
            db.func.count(PublicToilet.id).label('count')
        ).group_by(PublicToilet.city).order_by(db.desc('count')).limit(10).all()
        
        # 按類型統計
        type_stats = db.session.query(
            PublicToilet.toilet_type,
            db.func.count(PublicToilet.id).label('count')
        ).group_by(PublicToilet.toilet_type).order_by(db.desc('count')).limit(10).all()
        
        result = {
            'total': total_count,
            'by_city': [{'city': city, 'count': count} for city, count in city_stats],
            'by_type': [{'type': toilet_type, 'count': count} for toilet_type, count in type_stats]
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ 獲取統計資訊錯誤: {str(e)}")
        return jsonify({"error": str(e)}), 500
# ======= 測試路由 =======
@app.route('/api/test', methods=['GET'])
def test_database():
    """測試資料庫連接和資料"""
    try:
        # 測試查詢前 5 個廁所
        toilets = PublicToilet.query.limit(5).all()
        
        result = {
            'database_connected': True,
            'total_toilets': PublicToilet.query.count(),
            'sample_toilets': [
                {
                    'toilet_id': toilet.toilet_id,
                    'name': toilet.name,
                    'city': toilet.city,
                    'latitude': float(toilet.latitude) if toilet.latitude else None,
                    'longitude': float(toilet.longitude) if toilet.longitude else None
                }
                for toilet in toilets
            ]
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'database_connected': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
