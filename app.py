from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasklist.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

CATEGORY_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(7), nullable=False)
    comments = db.Column(db.Text)
    tasks = db.relationship('Task', backref='category', lazy=True, cascade='all, delete-orphan')

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)
    comments = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    subtasks = db.relationship('Subtask', backref='task', lazy=True, cascade='all, delete-orphan')

class Subtask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)
    comments = db.Column(db.Text)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)

@app.route('/')
def index():
    return render_template('index.html', colors=CATEGORY_COLORS)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([{'id': c.id, 'name': c.name, 'color': c.color} for c in categories])

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    category_id = request.args.get('category_id', type=int)
    if category_id:
        tasks = Task.query.filter_by(category_id=category_id).all()
    else:
        tasks = Task.query.all()
    
    result = []
    for task in tasks:
        subtasks = [{'id': s.id, 'content': s.content, 'done': s.done} for s in task.subtasks]
        result.append({
            'id': task.id,
            'content': task.content,
            'done': task.done,
            'category_id': task.category_id,
            'subtasks': subtasks
        })
    return jsonify(result)

@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.json
    new_category = Category(name=data['name'], color=data['color'])
    db.session.add(new_category)
    db.session.commit()
    return jsonify({'id': new_category.id, 'name': new_category.name, 'color': new_category.color})

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.json
    new_task = Task(content=data['content'], category_id=data['category_id'])
    db.session.add(new_task)
    db.session.commit()
    return jsonify({'id': new_task.id, 'content': new_task.content, 'done': new_task.done, 'category_id': new_task.category_id})

@app.route('/api/subtasks', methods=['POST'])
def add_subtask():
    data = request.json
    new_subtask = Subtask(content=data['content'], task_id=data['task_id'])
    db.session.add(new_subtask)
    db.session.commit()
    return jsonify({'id': new_subtask.id, 'content': new_subtask.content, 'done': new_subtask.done, 'task_id': new_subtask.task_id})

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.done = request.json['done']
    db.session.commit()
    return jsonify({'id': task.id, 'content': task.content, 'done': task.done, 'category_id': task.category_id})

@app.route('/api/subtasks/<int:subtask_id>', methods=['PUT'])
def update_subtask(subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    subtask.done = request.json['done']
    db.session.commit()
    return jsonify({'id': subtask.id, 'content': subtask.content, 'done': subtask.done, 'task_id': subtask.task_id})

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    return '', 204

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return '', 204

@app.route('/api/subtasks/<int:subtask_id>', methods=['DELETE'])
def delete_subtask(subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    db.session.delete(subtask)
    db.session.commit()
    return '', 204

@app.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = Category.query.get_or_404(category_id)
    return jsonify({
        'id': category.id,
        'name': category.name,
        'color': category.color,
        'comments': category.comments
    })

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify({
        'id': task.id,
        'content': task.content,
        'done': task.done,
        'comments': task.comments,
        'category_id': task.category_id
    })

@app.route('/api/subtasks/<int:subtask_id>', methods=['GET'])
def get_subtask(subtask_id):
    subtask = Subtask.query.get_or_404(subtask_id)
    return jsonify({
        'id': subtask.id,
        'content': subtask.content,
        'done': subtask.done,
        'task_id': subtask.task_id
    })

@app.route('/api/categories/<int:category_id>/comments', methods=['PUT'])
def update_category_comments(category_id):
    category = Category.query.get_or_404(category_id)
    category.comments = request.json['comments']
    db.session.commit()
    return jsonify({'id': category.id, 'comments': category.comments})

@app.route('/api/tasks/<int:task_id>/comments', methods=['PUT'])
def update_task_comments(task_id):
    task = Task.query.get_or_404(task_id)
    task.comments = request.json['comments']
    db.session.commit()
    return jsonify({'id': task.id, 'comments': task.comments})
    
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)