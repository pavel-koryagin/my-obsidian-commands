import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

function cssName(name: string) {
	return 'my-commands_' + name;
}

interface MyCommandsPluginSettings {}

const DEFAULT_SETTINGS: MyCommandsPluginSettings = {}

export default class MyCommandsPlugin extends Plugin {
	settings: MyCommandsPluginSettings;

	async onload() {
		await this.loadSettings();

		// new-version-of-the-file
		this.addCommand({
			id: 'new-file',
			name: 'Create a new file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new PromptModal({
					app: this.app,
					title: 'File name:',
					initialValue: this.getNoteId() + ' - ',
					onSubmit: async (result) => {
						const createdFile = await this.app.vault.create(result + '.md', '');
						await view.leaf.openFile(createdFile);
					}
				}).open();
			}
		});

		// new-version-of-the-file
		this.addCommand({
			id: 'new-version-of-the-file',
			name: 'Create the new version of the file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new PromptModal({
					app: this.app,
					title: 'New version name:',
					initialValue: this.getNewVersionFileName(view.file.basename),
					onSubmit: async (result) => {
						const createdFile = await this.app.vault.copy(view.file, `${result}.${view.file.extension}`);
						await view.leaf.openFile(createdFile);
					}
				}).open();
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	getNewVersionFileName(prevFileName: string) {
		let result = prevFileName;
		// PN mark
		result = result.replace(/^\+/, '');

		// Date time
		result = result.replace(/^\d\d\d\d-\d\d-\d\d \d\d\d\d/, this.getNoteId());

		// Version
		result = result.replace(
			/^(\d\d\d\d-\d\d-\d\d \d\d\d\d(?: - \w+)?)(?:( v)(\d+))?( - )/,
			(all, prefix, vPrefix, version, suffix) => {
				return prefix + (vPrefix || ' v') + String(Number(version || 1) + 1) + suffix;
			}
		);

		return result;
	}

	getNoteId() {
		const d = new Date();
		return d.getFullYear() + '-'
			+ String(d.getMonth() + 1).padStart(2, '0') + '-'
			+ String(d.getDate()).padStart(2, '0')
			+ ' '
			+ String(d.getHours()).padStart(2, '0')
			+ String(d.getMinutes()).padStart(2, '0');
	}
}

class PromptModal extends Modal {
	title: string;
	result: string;
	onSubmit: (result: string) => void;

	constructor({ title, initialValue = '', onSubmit }: { app: App; title: string; initialValue?: string; onSubmit: (result: string) => void }) {
		super(app);
		this.title = title;
		this.result = initialValue;
		this.onSubmit = onSubmit;
	}

	complete() {
		this.close();
		this.onSubmit(this.result);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: this.title });

		const onSuccess = () => {

		}

		const editSetting = new Setting(contentEl)
			.addText((text) => {
				text.setValue(this.result);
				text.onChange((value) => {
					this.result = value
				})
			});
		editSetting.infoEl.style.display = 'none';
		editSetting.controlEl.addClass(cssName('wide-input'));
		editSetting.controlEl.addEventListener('keypress', (e) => {
			if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
				this.complete();
			}
		});

		const btnSetting = new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("OK")
					.setCta()
					.onClick(() => this.complete()));
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
