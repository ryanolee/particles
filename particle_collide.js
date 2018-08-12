
const CONFIG = {
	debug_view: 0,
	screen:{
		width: 500,
		height: 500
	},
	frameRate: 60,
	line_thickness: 2,
	wrap_screen: true,
	min_collide_size: 10,
	world: {
		particle_count: 500,
		dampening_factor: 0.5
	}
}

var globals = {};

function setup() {
	createCanvas(CONFIG.screen.width, CONFIG.screen.height);
	background(200,200,200);
	frameRate(CONFIG.frameRate);
	strokeWeight(CONFIG.line_thickness);

	globals.objects = create_particles();
	//globals.objects = [];
	//globals.objects.push(new Particle(50,50,1,[1,1]));
	//globals.objects.push(new Particle(100,100,1,[0,0]));

	//globals.objects.push(new Particle(150,150,1,[-1,-1]));
}

function draw() {
	background(200,200,200);
	stroke(255,0,0); 
	globals.objects.forEach((object) => {
		object.update();
		object.render();
	})

	collision_detection();
	
}

function create_particles(){
	to_return = [];
	for(i=0; i<CONFIG.world.particle_count; i++){
		to_return.push(new Particle(random(CONFIG.screen.width), random(CONFIG.screen.height),100,[random(3,-3),random(3,-3)]))
	}
	return to_return;
}

class ForceEmitter{
	constructor(init_x, init_y, power=1, range=100){
		this.x = init_x;
		this.y = init_y;
		this.power = power;
		this.radius = power;
		this.range = range;
	}

	in(x, y ,w ,h){
		//Make checks in all 4 corners of squared region and check the shortest corner is not as far from the corner as the radius
		return Math.min([[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(function(item){return distance(x,y,this.x,this.y);}.bind(this))) < this.power;
	}

	collide(against){

	}
}

class Particle{
	constructor(init_x, init_y, mass = 100, velocity = [0, 0], radius = 10){
		this.x = init_x;
		this.y = init_y;
		this.forces = [];
		this.velocity = velocity;
		this.acceleration = [0,0];
		this.mass = mass;
		this.resultant_force = [0,0]
		this.radius = 10;
		this.collided = [];
	}
	
	render(){
		ellipse(this.x, this.y, this.radius);
		//line(this.x, this.y, this.x+this.resultant_force[0], this.y+this.resultant_force[1])
	}
	
	update_resultant_force(){
		if (this.forces.Length === 0){
			this.resultant_force= [0,0]
		}
		else{
			this.resultant_force = [
				this.forces.reduce((x_total , item) => x_total + item[0], 0),
				this.forces.reduce((y_total , item) => y_total + item[1], 0)
			]
		}
	}
	
	update_acceleration(){
		this.acceleration = [this.resultant_force[0]/this.mass, this.resultant_force[1]/this.mass]
	}

	update_velocity(){
		this.velocity = [this.velocity[0]+this.acceleration[0],this.velocity[1]+this.acceleration[1]]
	}

	clear_forces(){
		if(this.forces.length ==2){
			console.log(this);
		}
		this.forces = [];
	}

	in(x, y, w, h){
		
		return this.x > x && this.x < x+w && this.y > y &&  this.y < y+h || Math.abs(x - this.x) < this.radius || Math.abs(x - this.y) < this.radius; 
		//Math.min([[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(function(item){return distance(x,y,this.x,this.y);}.bind(this))) < this.radius;
	}

	apply_force(force){
		this.forces.push(force);
	}

	impulse_vector_from_particle_self(other,time = 0.01){
		const m1 = this.mass;
		const m2 = other.mass;
		return [
			(((
				((m1 - m2) /
				(m1 + m2)) * this.velocity[0] + 
				((2 * m2)/
				(m1 + m2))* other.velocity[0]
			) - this.velocity[0]) ) * m1 * CONFIG.world.dampening_factor,
			(((
				((m1 - m2) /
				(m1 + m2)) * this.velocity[1] + 
				((2 * m2)/
				(m1 + m2))* other.velocity[1]
			) - this.velocity[1]) ) * m1 * CONFIG.world.dampening_factor

		]
	}

	impulse_vector_from_particle_other(other,time = 0.01){
		const m1 = this.mass;
		const m2 = other.mass;
		return [
			(((((2*m2)/
			(m1+m2)) * this.velocity[0] + 
			((m2-m1)/
			(m1+m2)) * other.velocity[0]) -other.velocity[0])) * m1 * CONFIG.world.dampening_factor,
			(((((2*m2)/
			(m1+m2)) * this.velocity[1] + 
			((m2-m1)/
			(m1+m2)) * other.velocity[1]) -other.velocity[1])) * m1 * CONFIG.world.dampening_factor

		]
		
	}

	has_collided(other){
		return this.collided.indexOf(other) != -1;
	}

	collided_still(other){
		return other.radius+this.radius > distance(other.x,other.y,this.x,this.y)
	};

	collide(other){
		if (other instanceof Particle){
			if (! this.has_collided(other) && other.radius+this.radius > distance(other.x,other.y,this.x,this.y)){
				this.apply_force(
					this.impulse_vector_from_particle_self(other)
				);
				this.collided.push(other);
				other.apply_force(
					this.impulse_vector_from_particle_other(other)
				)
				
				other.collided.push(this);
				//throw err;
			}
		}
	}

	clear_collided(){
		this.collided = this.collided.filter((item)=>this.collided_still(item));
	}

	move(){
		this.x += this.velocity[0];
		this.y += this.velocity[1];

		if(CONFIG.wrap_screen){
			if(this.x > CONFIG.screen.width){
				this.x = 0;
			}
			if(this.x < 0){
				this.x = CONFIG.screen.width;
			}
			if(this.y > CONFIG.screen.height){
				this.y = 0;
			}
			if(this.y < 0){
				this.y = CONFIG.screen.height;
			}
		}
	}

	update(){
		this.update_resultant_force();
		this.update_acceleration();
		this.update_velocity();
		this.clear_forces();
		this.clear_collided();
		this.move();
	}
}

function collision_detection(x = 0, y = 0, w = null, h = null, targets = null){
	w = w || CONFIG.screen.width;
	h = h || CONFIG.screen.height;
	targets = targets || globals.objects;
	//half width/height
	hw = w/2;
	hh = h/2;

	if( CONFIG.debug_view === 1){trans_rect(x, y, w, h);}
	if(targets.length<=2 || hw < CONFIG.min_collide_size){
		targets.forEach((focus) => {
			targets.filter((item) => item!==focus).forEach((other) => {
				focus.collide(other);
			});
		});
		return;
	}
	
	[[x,y,hw,hh],[x+hw,y,hw,hh],[x+hw,y+hh,hw,hh],[x,y+hh,hw,hh]].forEach(function(p){
		targets_in = [];

		for(var i in targets){
			if(targets[i].in(p[0],p[1],p[2],p[3])){
				targets_in.push(targets[i]);
			}
		}
		
		collision_detection(p[0],p[1],p[2],p[3], targets_in)
	})
}

function distance(x1, y1, x2, y2){
	return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))
}

function trans_rect(x, y, w, h){
	line(x,y,x+w,y);
	line(x,y,x,y+h);
	line(x+w,y,x+w,y+h);
	line(x,y+h,x+w,y+h)
}

