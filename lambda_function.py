import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import logging
import random

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
spots    = dynamodb.Table('date_spot')

# 1件取得
def get_spot(id):
    logger.info('arguments : ' + id)
    try:
        response = spots.get_item(
            Key={ 'spot_id': id }
        )
    except Exception as e:
        raise e
    
    # 指定されたIDを持つItemが存在しない場合 None を返す
    try:
        if response['Item'] != '':
            return response['Item']
        else:
            return None
            
    except Exception:
        return None

# 全件取得
def get_spots():
    try:
        response = spots.scan()
        
        if response['Items'] != '':
            return response
        else:
            return None
            
    except Exception as e:
        raise e

# カテゴリ別全件取得
def get_spots_by_genre(id, filter):
    try:
        if filter == None:
            response = spots.query(
                IndexName='genre_id-index',
                KeyConditionExpression=Key('genre_id').eq(id)
            )
        else:
            response = spots.query(
                IndexName='genre_id-index',
                KeyConditionExpression=Key('genre_id').eq(id),
                FilterExpression=Attr('name').contains(filter)
            )
        
        if response['Items'] != '':
            return response
        else:
            return None
            
    except Exception as e:
        raise e

# 新規追加, 更新
def put_spot(spot_id, genre_id, name):
    try:
        response = spots.put_item(
            Item={
                'spot_id'  : spot_id,
                'genre_id' : genre_id,
                'name'     : name
            }
        )
    except Exception as e:
        raise e

# 削除
def delete_spot(spot_id):
    try:
        response = spots.delete_item(
            Key={
                'spot_id' : spot_id
            }
        )
    except Exception as e:
        raise e
    

# Lambdaから直接テストした時と、API Gateway経由でテストした時でeventのタイプが違う
#   Lambdaから直接  : dict
#   API Gateway経由 : json
# どちらの型でもpayload変数で処理できるようにする
def load_payload(body):
    try:
        payload = json.loads(body)
    except Exception:
        payload = body

    return payload

# API Gatewayのルールに則った成功の response を生成する
def create_success_response(body, **kwargs):
    origin  = '*'
    #origin  = 'https://dateconcierge.s3.us-east-2.amazonaws.com'
    methods = 'GET'
    
    for k, v in kwargs.items():
        if k == 'origin'  : origin  = v
        if k == 'methods' : methods = v 
    
    headers = {
        'Access-Control-Allow-Headers' : 'Content-Type',
        'Access-Control-Allow-Origin'  : origin,
        'Access-Control-Allow-Methods' : methods
    }
    
    logger.info(
        'return values headers = {}, body = {}, origin = {}, methods = {}'
            .format(headers, body, origin, methods)
    )
    
    return {
        'isBase64Encoded': False,
        'statusCode'     : 200,
        'headers'        : headers,
        'body'           : json.dumps(body)
    }

# API Gatewayのルールに則った失敗の response を生成する
def create_error_response(body, **kwargs):
    origin  = '*'
    #origin  = 'https://dateconcierge.s3.us-east-2.amazonaws.com'
    methods = 'GET'
    
    for k, v in kwargs.items():
        if k == 'origin'  : origin  = v
        if k == 'methods' : methods = v 

    headers = {
        'Access-Control-Allow-Headers' : 'Content-Type',
        'Access-Control-Allow-Origin'  : origin,
        'Access-Control-Allow-Methods' : methods
    }
    
    return {
        'isBase64Encoded': False,
        'statusCode': 599,
        'headers': headers,
        'body': json.dumps(body)
    }

def lambda_handler(event, context):
    logger.info('lambda called.')
    logger.info('http method is {}'.format(event['httpMethod']))
    logger.info('queryStringParameters is {}'.format(event['queryStringParameters']))

    if event['httpMethod'] == 'GET':
        logger.info('handle the get method.')

        if event['path'] == '/date_concierge':
            
            #=======================================================
            # GET : ID指定取得と全件取得の処理
            #=======================================================
            
            spot_id  = None
            genre_id = None
            filter   = None
            
            for k, v in event['queryStringParameters'].items():
                logger.info('key = {}, value = {}'.format(k, v))
                
                if k == 'spot_id':
                    spot_id = v
                if k == 'genre_id':
                    genre_id = v
                if k == 'filter':
                    filter = v
            
            
            if spot_id != None:
                logger.info('get spot by spot_id.')
                response = get_spot(spot_id)
                
                return create_success_response(
                    response,
                    methods='GET'
                )
                
            if genre_id != None:
                logger.info('get spots by genre_id.')
                response = get_spots_by_genre(genre_id, filter)
                
                return create_success_response(
                    response,
                    methods='GET'
                )
        
            logger.info('get all spots.')
            response = get_spots()
            
            return create_success_response(
                response,
                methods='GET'
            )
            
        else:
            #=======================================================
            # GET : プランをランダムで返す処理
            #=======================================================
            genres = ('main', 'lunch', 'dinner', 'tea', 'alcohol')
            ids    = ('001',  '002',   '003',    '004', '005')
            
            response = {}
            
            # issue: 全表走査がかかりまくるので計算量が爆発する。対処が必要。
            #        件数を保持するテーブルを持って、ジャンルごとにテーブル分けたほうが良いか…？
            #        そうするとCRUD全部作り直しなので何かいいアイデアがないか。
            for genre, id in zip(genres, ids):
                logger.info('random spot selection: genre {} genre_id {}'.format(genre, id))
                r = get_spots_by_genre(id, None)
                
                rnd = random.randrange(r['Count'])
                rnd_spot_id = r['Items'][rnd]['spot_id']
                rnd_spot = get_spot(rnd_spot_id)
                
                response[genre] = rnd_spot
            
            return create_success_response(
                response,
                methods='GET'
            )
    
    #=======================================================
    # OPTIONS : CORSに必要
    #=======================================================
    elif event['httpMethod'] == 'OPTIONS':
        logger.info('handle the options method.')
        
        return create_success_response(
            { 'message': 'successfully: called options method.' },
            methods='OPTIONS,GET,PUT,PATCH,DELETE'
        )
    
    #=======================================================
    # POST : 新規登録の処理
    #=======================================================
    elif event['httpMethod'] == 'POST':
        logger.info('handle the post method.')
        
        payload = load_payload(event['body'])
        
        # 指定されたIDがすでに使用されていた場合、エラーを返す
        spot = get_spot(payload['spot_id'])
        
        if spot != None:
            return create_error_response(
                { 'message': 'error: spot_id is already in use.' }
            )

        # 指定されたIDが使用されていない場合、新規に登録する
        put_spot(
            payload['spot_id'],
            payload['genre_id'],
            payload['name']
        )
        
        return create_success_response(
            { 'message': 'successfully: added new datespot.' },
            methods='POST'
        )
    
    #=======================================================
    # PATCH : 更新の処理
    #=======================================================
    elif event['httpMethod'] == 'PATCH':
        logger.info('handle the patch method.')
        
        payload = load_payload(event['body'])
        
        # 指定されたIDが使用されていない場合、エラーを返す
        spot = get_spot(payload['spot_id'])
        
        if spot == None:
            return create_error_response(
                { 'message': 'error: spot_id is not exist.' }
            )
        
        # 指定されたIDが使用されている場合、更新する
        put_spot(
            payload['spot_id'],
            payload['genre_id'],
            payload['name']
        )
        
        return create_success_response(
            { 'message': 'successfully: datespot was update.' },
            methods='PATCH'
        )
    
    #=======================================================
    # DELETE : 削除の処理
    #=======================================================
    elif event['httpMethod'] == 'DELETE':
        logger.info('handle the delete method.')
        
        payload = load_payload(event['body'])
        
        # 指定されたIDが使用されていない場合、エラーを返す
        spot = get_spot(payload['spot_id'])
        
        if spot == None:
            return create_error_response(
                { 'message': 'error: spot_id is not exist.' }
            )
        
        # 指定されたIDが使用されている場合、削除する
        delete_spot(payload['spot_id'])
        
        return create_success_response(
            {  'message': 'successfully: datespot was delete.' },
            methods='DELETE'
        )
