"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const skill_model_1 = require("../models/skill.model");
dotenv_1.default.config();
const masterSkillList = [
    // TECH (Coding, Software, Hardware)
    { name: 'JavaScript / TypeScript', category: 'Tech' },
    { name: 'Python Programming', category: 'Tech' },
    { name: 'React / Next.js', category: 'Tech' },
    { name: 'Node.js Backend', category: 'Tech' },
    { name: 'Mobile App Dev (React Native)', category: 'Tech' },
    { name: 'Swift (iOS)', category: 'Tech' },
    { name: 'Kotlin (Android)', category: 'Tech' },
    { name: 'HTML / CSS / Tailwind', category: 'Tech' },
    { name: 'WordPress / CMS', category: 'Tech' },
    { name: 'Cybersecurity Basics', category: 'Tech' },
    { name: 'Blockchain / Web3', category: 'Tech' },
    { name: 'Data Science / Analysis', category: 'Tech' },
    { name: 'Excel / Google Sheets Wizardry', category: 'Tech' },
    { name: 'PC Building & Repair', category: 'Tech' },
    { name: 'IT Support / Troubleshooting', category: 'Tech' },
    { name: 'Game Development (Unity/Unreal)', category: 'Tech' },
    { name: 'AI / Machine Learning', category: 'Tech' },
    // DESIGN (Visuals, UI/UX, Art)
    { name: 'UI/UX Design (Figma)', category: 'Design' },
    { name: 'Logo & Brand Identity', category: 'Design' },
    { name: 'Graphic Design (Photoshop/Canva)', category: 'Design' },
    { name: 'Illustration / Digital Art', category: 'Design' },
    { name: 'Video Editing (Premiere/DaVinci)', category: 'Design' },
    { name: 'Motion Graphics (After Effects)', category: 'Design' },
    { name: '3D Modeling (Blender/Maya)', category: 'Design' },
    { name: 'Animation', category: 'Design' },
    { name: 'Interior Design', category: 'Design' },
    { name: 'Fashion Design / Sewing', category: 'Design' },
    { name: 'Photography (Portrait/Product)', category: 'Design' },
    { name: 'Photo Editing / Retouching', category: 'Design' },
    // LANGUAGE (Spoken languages & Tutoring)
    { name: 'English Conversation', category: 'Language' },
    { name: 'Business English', category: 'Language' },
    { name: 'Spanish Tutoring', category: 'Language' },
    { name: 'French Tutoring', category: 'Language' },
    { name: 'Mandarin Chinese', category: 'Language' },
    { name: 'Japanese', category: 'Language' },
    { name: 'Korean', category: 'Language' },
    { name: 'German', category: 'Language' },
    { name: 'Italian', category: 'Language' },
    { name: 'Portuguese', category: 'Language' },
    { name: 'Russian', category: 'Language' },
    { name: 'Arabic', category: 'Language' },
    { name: 'Sign Language (ASL)', category: 'Language' },
    { name: 'Translation Services', category: 'Language' },
    // BUSINESS (Professional skills, Marketing, Finance)
    { name: 'Digital Marketing / SEO', category: 'Business' },
    { name: 'Social Media Management', category: 'Business' },
    { name: 'Content Writing / Copywriting', category: 'Business' },
    { name: 'Resume & Cover Letter Review', category: 'Business' },
    { name: 'Interview Preparation', category: 'Business' },
    { name: 'Public Speaking / Presentation', category: 'Business' },
    { name: 'Accounting / Bookkeeping', category: 'Business' },
    { name: 'Financial Planning / Investing', category: 'Business' },
    { name: 'Project Management (Agile/Scrum)', category: 'Business' },
    { name: 'Entrepreneurship Coaching', category: 'Business' },
    { name: 'Virtual Assistant Tasks', category: 'Business' },
    { name: 'Legal Consulting (Basics)', category: 'Business' },
    // MUSIC (Instruments, Production, Vocals)
    { name: 'Guitar (Acoustic/Electric)', category: 'Music' },
    { name: 'Piano / Keyboard', category: 'Music' },
    { name: 'Drums / Percussion', category: 'Music' },
    { name: 'Violin / Strings', category: 'Music' },
    { name: 'Bass Guitar', category: 'Music' },
    { name: 'Ukulele', category: 'Music' },
    { name: 'Singing / Vocal Coaching', category: 'Music' },
    { name: 'Music Production (Ableton/Logic)', category: 'Music' },
    { name: 'Songwriting / Composition', category: 'Music' },
    { name: 'DJing / Mixing', category: 'Music' },
    { name: 'Music Theory', category: 'Music' },
    // LIFESTYLE (Cooking, Gardening, DIY)
    { name: 'Cooking (General)', category: 'Lifestyle' },
    { name: 'Baking / Pastry', category: 'Lifestyle' },
    { name: 'Vegetarian / Vegan Cooking', category: 'Lifestyle' },
    { name: 'Meal Prepping', category: 'Lifestyle' },
    { name: 'Gardening / Plant Care', category: 'Lifestyle' },
    { name: 'Home Organization (KonMari)', category: 'Lifestyle' },
    { name: 'Carpentry / Woodworking', category: 'Lifestyle' },
    { name: 'DIY Home Repairs', category: 'Lifestyle' },
    { name: 'Knitting / Crochet', category: 'Lifestyle' },
    { name: 'Pet Care / Dog Training', category: 'Lifestyle' },
    { name: 'Travel Planning', category: 'Lifestyle' },
    { name: 'Tarot / Astrology Reading', category: 'Lifestyle' },
    { name: 'Meditation / Mindfulness', category: 'Lifestyle' },
    // FITNESS (Sports, Yoga, Training)
    { name: 'Personal Training (Gym)', category: 'Fitness' },
    { name: 'Yoga Instructor', category: 'Fitness' },
    { name: 'Pilates', category: 'Fitness' },
    { name: 'Running Coach / Pacing', category: 'Fitness' },
    { name: 'Swimming Lessons', category: 'Fitness' },
    { name: 'Tennis Coaching', category: 'Fitness' },
    { name: 'Boxing / Martial Arts', category: 'Fitness' },
    { name: 'Dance (Salsa, Hip Hop, Ballet)', category: 'Fitness' },
    { name: 'Nutrition / Diet Planning', category: 'Fitness' },
    { name: 'Cycling / Bike Repair', category: 'Fitness' },
    { name: 'Calisthenics', category: 'Fitness' },
    // ACADEMICS (Math, Science, History)
    { name: 'Math Tutoring (K-12)', category: 'Academics' },
    { name: 'Calculus / Advanced Math', category: 'Academics' },
    { name: 'Physics Tutoring', category: 'Academics' },
    { name: 'Chemistry / Biology', category: 'Academics' },
    { name: 'History / Social Studies', category: 'Academics' },
    { name: 'Essay Writing / Editing', category: 'Academics' },
    { name: 'Research Assistance', category: 'Academics' },
    { name: 'SAT / GRE / Test Prep', category: 'Academics' },
    { name: 'Computer Science Theory', category: 'Academics' },
    { name: 'Philosophy / Logic', category: 'Academics' },
];
const seedDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is missing in .env file.');
        }
        yield mongoose_1.default.connect(process.env.MONGO_URI, { dbName: 'swappa' });
        console.log('Connected to MongoDB.');
        yield skill_model_1.Skill.deleteMany({});
        console.log('Cleared existing skills.');
        yield skill_model_1.Skill.insertMany(masterSkillList);
        console.log(`Successfully seeded ${masterSkillList.length} skills into the database!`);
        process.exit();
    }
    catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
});
seedDB();
