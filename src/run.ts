const spawn = require('cross-spawn');
const spawnSync = spawn.sync;
const fs = require('fs');
const path = require('path');

module.exports = ({
	name,
	withReact,
	withTs
}: {
  name: string;
  withReact: boolean;
  withTs: boolean;
}) => {
	const projectDir = path.join(process.cwd(), name);
	const cliDir = path.join(__dirname, '../');

	npmModuleInit();
	generateFiles();
	installDeps();

	function npmModuleInit() {
		fs.existsSync(projectDir)
			? console.log('project existed')
			: fs.mkdirSync(projectDir);
		process.chdir(name);
		spawnSync('npm', ['init', '-y']);
	}

	function installDeps() {
    //构建依赖列表
    type DepsType = string[];
    const commonDevDeps: DepsType = [
    	'webpack',
    	'webpack-cli',
    	'webpack-dev-server',
    	'webpack-merge',
    	'html-webpack-plugin',
    	'css-loader',
    	'style-loader',
    	'babel-loader',
    	'@babel/core',
    	'@babel/preset-env'
    ];
    const devDepsForReact: DepsType = ['@babel/preset-react'];
    const devDepsForVue: DepsType = ['vue-loader@next', '@vue/compiler-sfc'];
    const depsForReact: DepsType = [
    	'react',
    	'react-dom',
    	'react-router',
    	'react-router-dom',
    	'react-document-title'
    ];
    const depsForVue: DepsType = ['vue@next', '@vue/runtime-core'];
    process.chdir(projectDir);
    //安装开发依赖
    spawnSync(
    	'npm',
    	['install', '-D', ...commonDevDeps]
    		.concat(withReact ? devDepsForReact : devDepsForVue)
    		.concat(withTs ? '@babel/preset-typescript' : []),
    	{
    		stdio: 'inherit'
    	}
    );

    //安装生产依赖
    spawnSync(
    	'npm',
    	['install'].concat(withReact ? depsForReact : depsForVue),
    	{
    		stdio: 'inherit'
    	}
    );
	}

	function generateFiles() {
		dirsInit();

		//脚手架中文件地址到项目文件地址的映射
		const srcToProjMapped: { [index: string]: string } = {
			'config/webpack.dev.js': 'build/webpack.dev.js',
			'config/webpack.prod.js': 'build/webpack.prod.js',
			[`config/${withReact ? 'react' : 'vue'}.common.js`]:
        'build/webpack.common.js',
			'template/index.html': 'public/index.html'
		};

		let srcDirInCli = '';
		if (withReact) {
			srcDirInCli = 'template/react';
			srcToProjMapped[`${srcDirInCli}/index.css`] = 'src/index.css';
			srcToProjMapped[`${srcDirInCli}/index.jsx`] = `src/index.${
				withTs ? 't' : 'j'
			}sx`;
			srcToProjMapped[`${srcDirInCli}/App.jsx`] = `src/App.${
				withTs ? 't' : 'j'
			}sx`;
			srcToProjMapped[
				`${srcDirInCli}/components/greeting.jsx`
			] = `src/components/greeting.${withTs ? 't' : 'j'}sx`;
			srcToProjMapped[`${srcDirInCli}/components/index.css`] =
        'src/components/index.css';
		} else {
			srcDirInCli = 'template/vue';
			srcToProjMapped[`${srcDirInCli}/index.js`] = `src/index.${
				withTs ? 't' : 'j'
			}s`;
			srcToProjMapped[`${srcDirInCli}/App.vue`] = 'src/App.vue';
			srcToProjMapped[`${srcDirInCli}/components/greeting.vue`] =
        'src/components/greeting.vue';
		}

		//将脚手架中文件赋值到所创建项目中
		for (const [src, dest] of Object.entries(srcToProjMapped)) {
			fs.copyFileSync(path.join(cliDir, src), path.join(projectDir, dest));
		}

		pkgJsonInit();

		//创建目录结构
		function dirsInit() {
			process.chdir(projectDir);
			fs.mkdirSync('build');
			fs.mkdirSync('public');
			fs.mkdirSync('src');
			process.chdir('src');
			fs.mkdirSync('components');
			process.chdir(projectDir);
		}
		//修改package.json
		function pkgJsonInit() {
			process.chdir(projectDir);
			const pkgJson = require(path.join(projectDir, './package.json'));
			pkgJson['main'] = `./src/index.${
				withTs ? (withReact ? 'tsx' : 'ts') : withReact ? 'jsx' : 'js'
			}`;
			pkgJson['scripts']['start'] =
        'webpack server --open --config ./build/webpack.dev.js';
			pkgJson['scripts']['build'] = 'webpack --config ./build/webpack.prod.js';
			fs.writeFileSync('package.json', JSON.stringify(pkgJson, null, 4));
		}
	}
};
